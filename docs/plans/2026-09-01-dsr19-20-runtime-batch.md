# Plan Packet: DSR-19/20 runtime 是正 batch（toast 2 件 + destructive variant 統一 + 硬化明示化 + cancel 文言）

Design Phase は PR #22（squash `8b744f1`、2026-08-30 merge）で完了済み。DSR-19「作成・保存成功の feedback 規約」/ DSR-20「destructive 確認 dialog の配置・dismiss 規約」/ SPEC-SUP-D11（78 §78.5）/ SPEC-PRV-D8（77）は source docs に正本化済み。本 packet はその runtime 是正 R3（R3 キュー ③。owner 裁定 2026-08-30 の R3 キューのうち ①② は PR #23 / #24 で完了、残る「操作ログ producer 実効化 R3」は本 change 完了後の次番）。

## Workflow State

- Phase: human-confirm
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 5d7abb3
- Amendments: 2433199
- Coordinator: Claude Fable 5 (main session)
- Writer: Codex (GPT-5.6、発注書駆動)
- Plan Reviewer: Claude Sonnet 5 (independent fresh context)
- Final Reviewer: Claude Sonnet 5 (independent fresh context) + Coordinator mutation 独立再実測
- Reviewed Content HEAD: 032b75d
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（L3-1〜L3-5）、Ready 承認、merge

Phase 遷移記録（kickoff → spec-check → plan-draft → plan-gate、本 plan-first commit に同乗）: task scope と R3 判定は本 packet に記録。spec-check では in-scope source docs（design-system 01 DSR-03/07/08/19/20、catalog ⑦⑧、78 §78.5、77）が PR #22 で改訂済み・実装十分と判定し、spec-check → plan-draft の許可された skip（Design Readiness が既存 docs 充足を引用）を適用。packet + Test Design Matrix を同 commit で commit し plan-gate に至る。

## Owner Effort Budget

- 介入回数上限: 5（視覚系 UI change のため既定 3 から引き上げ — render oracle は owner の目のみで、toast 表示・variant 色の L3 が判定の本丸になる先例 PR #15 に従う）
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 1 回目は R3 キュー選定の委任（2026-09-01、owner が「順不問・選定任せる」を明示）で消費済み。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
Risk Tiers R3 行のうち operator workflow（作成・保存成功の完了 feedback 追加 2 flow、destructive 確認の視覚強調変更 7 dialog、cancel 文言変更 2 件 — 毎日の業務操作の見え方・読みが変わる）に該当。DB / POS CSV / Tauri command DTO / bindings / route / merge gate は変更しない（UI 層内のみ、AC で bindings 差分ゼロを機械確認）。

## Goal

Goal Invariant:

### 最小完了条件

(1) 取引先追加（2 実装とも）と価格改定の行確定の成功時に DSR-19 適合の完了 toast が出る。(2) destructive 確認 dialog の実行 Action が disposition table（D-C）どおり `variant="destructive"` に統一される。(3) DSR-20 非適合の cancel 文言（「戻る」「やめる」）が消える。(4) UnsavedChangesDialog の暗黙硬化が CostDiffDialog 同型の明示 prop + 意図 comment に置き換わり、利用者から見た挙動は不変。

### 失敗定義

- 取引先追加 2 実装のどちらか、または行確定で成功 toast が出ない。
- disposition table で destructive とした dialog のいずれかが default variant のまま残る。または非 destructive とした dialog（PLU 一括 / 統合 stage 1「次へ」）が destructive 化される（Von Restorff の毀損）。
- cancel 文言「戻る」「やめる」が対象 2 dialog に残存する。
- UnsavedChangesDialog の Esc / 外側クリック挙動が変わる（従来 = 閉じない、を維持できない）。
- 既存 toast（文言・duration・id）・既存 dialog の dismiss 配線に regression が出る。

### 非目的

- toast id の既存未付与 site（PLU 書出し・backup・閾値・取込み flow 等 20 site 超 — 2026-09-01 再実測）への retrofit。DSR-19 は単発・重複経路なしの通知に id を必須とせず、design phase の前提（既存 toast 実装は追認）を踏襲する。
- 既存 toast 文言・duration の変更。
- 保存結果 panel が詳細往復で消える件 / 廃棄保存結果の詳細 link（PR #23 L3 観察起源の design-first backlog、別管理）。
- 操作ログ producer 実効化 R3（キュー次番、PR #23 L3-3 waiver の義務 L3 込み）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

1. **取引先追加の成功 toast**（SPEC-SUP-D11）: `CreateSupplierDialog` 2 実装（`src/features/products/components/` / `src/features/suppliers/components/`）の成功経路に、返された取引先名を含む完了 toast を追加（D-A）。失敗時は現行どおり toast なし・入力保持。
2. **価格改定 行確定の成功 toast**（SPEC-PRV-D8）: `PriceRevisionTable` の `onSuccess` に、対象商品名を含む完了 toast を追加（D-B: duration 5000 / 商品単位 id）。失敗時は現行の行内 error 表示のまま toast なし。
3. **destructive variant 統一 7 dialog**（DSR-20）: disposition table（D-C)の是正対象 7 件の実行 Action を `variant="destructive"` へ変更。DOM 順・dismiss 配線・文言（cancel 除く）は変更しない。
4. **cancel 文言是正 2 件**（DSR-20）: `ProductImportPreview` の「戻る」と `BackupRestorePage` 復元確認の「やめる」を既定の「キャンセル」へ（D-D）。
5. **UnsavedChangesDialog の明示硬化**（DSR-20 硬化手段の 1 系統化): `onOpenChange` 非配線による暗黙硬化を、CostDiffDialog 同型の明示 prop（Esc / 外側クリックの preventDefault 系）+ 硬化条件 (b) の意図 comment へ置換（D-E）。挙動不変。
6. **契約 test 追加**: Matrix T1〜T12。既存 test の削除・無効化なし。既存 dialog test に Action button の variant / class 固定値アサートがある場合は実装に伴う**正当な更新対象**であり T12 の「無変更 green」対象に含めない（Writer は更新箇所を PR body に列挙し、アサートの弱体化はしない）。

## Non-scope

- `#3 PLU 一括対象確認` / `#11 統合 stage 1「次へ」` の variant 変更（D-C で非 destructive と裁定、T8 で default 維持を保護）。
- 全 dialog の dismiss 配線変更（本則の `onOpenChange` ブリッジは 2026-09-01 実測で適合済み。硬化是正は Scope 5 のみ）。
- `CostDiffDialog`（明示硬化の適合済み参照実装 — 変更しない）。
- Tauri command / DTO / bindings / DB / CSV format / route の変更。

## 設計判断（実装方式の確定）

- **D-A（取引先追加 toast）**: 文言は取引先名を含む完了通知（例: `取引先「{name}」を追加しました`）。duration は全体既定 3000ms — DSR-19 判定で「単純な完了通知」（§78.6 改名・§78.7 統合の既存完了通知と同格・対称、取引先名は完了対象の識別であって読了必須の重要情報ではない）。toast id なし — dialog は成功時に閉じ、連打・再試行の重複経路がない（DSR-19「単発で重複経路がない通知には id を必須としない」）。2 実装は同一文言とし、両実装とも dialog 内部の `submit()` が確定済みで保持する trim 済み入力名（`trimmed`）を使って `toast.success` を呼ぶ — `onCreated` / caller 側の変更は不要（suppliers 版の `onCreated()` が supplier を返さない非対称は本 toast 実装に無関係。backend `find_or_create_supplier` は name exact match のため server 往復値を使う必然性もない — Plan Review round 1 P1-1 是正）。
- **D-B（行確定 toast）**: 文言は対象商品名を含む（SPEC-PRV-D8「対象商品と価格改定が完了したことを示す」）。duration 5000ms — DSR-19「商品名を含み、成功と同時に読んで確認する重要情報付き」（`ProductFormPage` 商品保存 5000 の先例と同型）。toast id は商品単位（例: `price-revision-success-${productId}`）— 同一商品の再確定・連打は置換し、別商品の連続確定は個別に残す（DSR-19「別商品…の成功まで同じ id で潰さない」の直適用。価格改定は 1 行ずつ連続確定する画面で、この分岐が実際に発生する）。
- **D-C（variant disposition table）**: 判定基準は DSR-07 の確認境界（破壊的・不可逆・重複計上高影響）× DSR-20「destructive 確認の実行 Action は variant destructive」。2026-09-01 再実測の 12 件全数に対する裁定:

| # | dialog | Action label | 裁定 | 根拠 |
|---|---|---|---|---|
| 1 | UnsavedChangesDialog | 破棄して移動 | 適合済み（変更なし） | 未保存内容の破棄 |
| 2 | DiscontinueConfirmDialog | 廃番にする | **→ destructive** | 商品の廃番化（DSR-07 例示の破壊的操作） |
| 3 | PluBulkTargetConfirmDialog | PLU 対象にする / 対象から外す | default 維持 | 同一操作で可逆な一括 flag 変更。destructive 強調は Von Restorff の希釈 |
| 4 | AdditionalImportConfirmDialog | 追加で取り込む | **→ destructive** | 誤実行 = 同日重複取込み → 在庫二重計上（DSR-07 例示） |
| 5 | ResultStep（CSV 取込み取消） | 取り消す | **→ destructive** | 取込み済み在庫変動の取消 |
| 6 | DailyReportImportPage（日報取消） | 取り消す | **→ destructive** | 同上 |
| 7 | IntegrityCheckPage | 補正を実行する | **→ destructive** | 在庫数の書換え |
| 8 | ProductImportPreview | 上書きして実行 | **→ destructive** | 既存マスタの上書き |
| 9 | StocktakePage | 確定する | **→ destructive** | 棚卸し確定（不可逆の在庫調整） |
| 10 | BackupRestorePage 復元確認 | （復元実行） | 適合済み（変更なし） | 現 DB の置換 |
| 11 | MergeSupplierDialog stage 1 | 次へ | default 維持 | 段階遷移のみで実行 Action ではない。destructive 確認は stage 2 が担う（DSR-20 3 ボタン先例の前提） |
| 12 | MergeSupplierDialog stage 2 | 統合する / 再試行 | 適合済み（変更なし） | 取引先統合（不可逆） |

- **D-D（cancel 文言）**: #8「戻る」/ #10「やめる」は DSR-20 が名指しで禁止する「後状態が判別できない語」のため既定の「キャンセル」へ。結果・遷移先を表す文言（「編集を続ける」型）への置換は、両 dialog とも「閉じて元の画面に留まる」以上の特別な後状態を持たず既定で十分と判断。#1「編集を続ける」/ #12「残す取引先を選び直す」は DSR-20 本文が許容例として明記済みで変更しない。
- **D-E（明示硬化）**: `UnsavedChangesDialog` は硬化条件 (b)（未保存内容の破棄/継続を明示選択させる）該当。CostDiffDialog（`src/features/receiving/CostDiffDialog.tsx:88-95`）を参照実装とし、Esc / 外側クリックの明示 preventDefault + 硬化条件 (b) を引く意図 comment を付す。probe (2) + typecheck 実証（2026-09-01）により明示 prop の組を確定: `AlertDialogContentProps` は `onPointerDownOutside` / `onInteractOutside` を型レベルで Omit しており適用不能（`node_modules/@radix-ui/react-alert-dialog/dist/index.d.ts:23`、Coordinator 実読裏取り済み）。明示硬化は `onEscapeKeyDown` の preventDefault のみとし、意図 comment に硬化条件 (b) と「外側クリックは Radix AlertDialog primitive 既定で非 dismiss（handler 非提供）」を明記する。外側クリックの非 dismiss は T10 の regression oracle として test で固定する。DSR-20 硬化手段の列挙が Dialog 前提である点は DSR-20 追記候補として closeout で起票（gated amendment 2026-09-01）。

## Acceptance Criteria

- AC1: 取引先追加 2 実装とも成功時に取引先名を含む `toast.success` が呼ばれる（T1 / T2、SPEC-SUP-D11）。
- AC2: 行確定成功時に商品名を含む toast が `duration: 5000` / 商品単位 `id` で出る（T4 / T5、SPEC-PRV-D8）。
- AC3: disposition table の是正 7 件すべての実行 Action が `variant="destructive"`、維持 2 件（#3 / #11）が default のまま。機械確認の正は T7 / T8 の per-dialog assert とする。補助の目視 sweep は D-C 表の 12 dialog file に path filter した `rg -n 'variant="destructive"' <対象 file 群>` で Action hit 10 箇所（既存 3 + 是正 7）— 裸の repo 全体 rg は `<Alert variant="destructive">` 50 箇所超が混入するため使わない（Plan Review round 1 P2-1 是正）。
- AC4: 対象 2 dialog（`ProductImportPreview.tsx` / `BackupRestorePage.tsx` 復元確認）の cancel 文言が「キャンセル」exact で、旧文言（当該 button の「戻る」「やめる」）が 0 hit（T9、対 oracle）。
- AC5: `UnsavedChangesDialog.tsx` が明示 prop + 意図 comment を持ち、Esc / 外側クリックで閉じない挙動が不変（T10 / T11）。
- AC6: `src/lib/bindings.ts` の diff ゼロ。
- AC7: frontend gate（typecheck / lint / format:check / test / build）green + `cargo check --release` PASS。
- AC8: 既存 test の削除・無効化（`skip` 含む）なし — `npm test` 全 suite green（正当な更新対象は Scope 6 の条件で PR body に列挙）。

## Design Sources

- Requirements / spec: SPEC-SUP-D11（78 §78.5）/ SPEC-PRV-D8（77 §77.7 行確定）— 新規 REQ token 追加なし
- Architecture: 変更なし（UI 層内）
- Function / command / DTO: `docs/function-design/78-ui-supplier-management.md` §78.5 / `77-ui-bulk-price-revision.md` 行確定節
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-19（toast 最低保証・duration 階層・id 基準）/ DSR-20（variant・配置・dismiss・硬化・cancel 文言）/ DSR-07（確認境界 = destructive 判定の根拠）/ DSR-03（toast vs Alert の refine 元）/ DSR-08（色単独禁止 — variant は複合強調）、`02-component-catalog.md` ⑦⑧
- Decision log / ADR: 変更なし（durable 決定は PR #22 で promote 済み）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし（AC6 で差分ゼロ機械確認） | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | DSR-19 / DSR-20 / DSR-07 / SPEC-SUP-D11 / SPEC-PRV-D8 / catalog ⑦⑧ | existing sufficient（PR #22 で正本化済み） |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | 変更なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| なし（route / command / REQ token / doc / 画面の新設なし） | Writer 作業中に REQ token 追加が必要になった場合は `generate_traceability` 再生成を同 commit で行う | 条件付き |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| SPEC-SUP-D11 | 78 §78.5 | D-A | 改名・統合に通知があり追加だけ欠ける非対称の是正（Peak-End / Zeigarnik は DSR-19 Why）。「一覧再取得で見えるから不要」案は PR #22 owner 裁定 B-2（toast 最低保証）で棄却済み | Scope 1 | T1 / T2 / T3 |
| SPEC-PRV-D8 | 77 行確定節 | D-B | 入力 clear + badge だけでは確定成功の瞬間が判別しにくい。duration 3000 案は商品名の確認読了に不足（ProductFormPage 5000 先例）、id なし案は連続確定での置換制御を失い DSR-19 id 基準に反するため棄却 | Scope 2 | T4 / T5 / T6 |
| DSR-20 variant | design-system 01 DSR-20 | D-C | 12 件中 9 件が default のままでは Von Restorff の孤立化が成立しない。全 12 件一律 destructive 化案は非 destructive Action（#3 / #11）まで強調し希釈を招くため棄却（DSR-07 境界で個別裁定） | Scope 3 | T7 / T8 |
| DSR-20 cancel 文言 | design-system 01 DSR-20 | D-D | 「戻る」「やめる」は後状態不明語として DSR-20 が名指し禁止。結果表現型への置換は特別な後状態がなく過剰のため既定「キャンセル」 | Scope 4 | T9 |
| DSR-20 硬化手段 | design-system 01 DSR-20 | D-E | 暗黙硬化（handler 非配線）は判読不能で DSR-20 が明示禁止。挙動を変えず実装だけ明示化。硬化解除案（Esc 有効化）は Zeigarnik 活用の先例評価（DSR-20 Why）に反するため棄却 | Scope 5 | T10 / T11 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: DSR-19/20 + SPEC-SUP-D11 / SPEC-PRV-D8 で成立（PR #22 完了済み）。
- Plan-only durable decisions found and promoted to source docs: なし。D-A〜D-E は DSR-19/20 の適用裁定（実装方式の選択）で、契約本体は source docs が既に保持。D-C の disposition が将来 durable 化に値すると判明したら catalog ⑧ 追記を follow-up 起票する。
- Assumptions and constraints: 既存 toast 文言・duration・id は変更しない（DSR-19 は現状を追認して基準化済み）。dialog の DOM 順・dismiss 配線は 2026-09-01 実測で全件本則適合。
- Deferred design gaps: toast id の未付与 site 棚卸し（20 site 超、is 実測 2026-09-01）は DSR-19 上の違反ではなく retrofit 不要と判断。保存結果 panel 消失 / 廃棄 link は design-first backlog。
- Test Design Matrix can cite design decision IDs: DSR-19 / DSR-20 / DSR-07 / SPEC-SUP-D11 / SPEC-PRV-D8 / D-A〜D-E を cite。
- Absolute guarantee / escape hatch self-check: 全変更が表示層の加算的変更（toast 追加・variant 変更・文言変更・prop 明示化）で、失敗時挙動・データ経路は不変。硬化明示化は挙動同値が oracle（T10 / T11）。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内のみ、外部 adapter 非接触 | — |
| Fact check / design decision split | toast 欠落 2 flow・12 dialog の variant / cancel 文言・暗黙硬化・Toaster 既定 3000ms は 2026-09-01 の起票時再実測（HEAD 99cf829、Explore 全数調査）で確認済みの観測事実。toast 最低保証・variant 統一・硬化手段は DSR-19/20（owner 裁定 B-2 / B-3）の design decision | 本 packet「起票時実測」節 |
| Lifecycle / retry | toast は表示のみで mutation lifecycle に非介入。行確定 toast の商品単位 id が再試行時の重複表示を置換 | Matrix T5 |
| Operator workflow | 保存操作の完了が視認でき、危険操作の実行 button が赤系で孤立する。cancel 文言の後状態が明確になる。読みの変化はあるが操作手順は全 flow 不変 | Matrix + L3 |
| Replacement path | not applicable（外部システム非接触） | — |
| Data safety / evidence | synthetic fixture のみ。実店舗データ非 commit | Data Safety 節 |
| Reporting / accounting semantics | not applicable（表示のみ、集計非接触） | — |
| Manual verification | toast 視認性・variant 色の render oracle は owner の目のみ（CSS 詳細度は自動 gate 素通り — PR #15 教訓）。L3-1〜L3-5 で確認 | Human Gate |
| 環境・再現性 | 新設の環境依存なし | — |

## Design Readiness

DSR-19 が toast 最低保証・duration 階層・id 基準を、DSR-20 が variant・配置・dismiss・硬化条件と手段・cancel 文言基準を、SPEC-SUP-D11 / SPEC-PRV-D8 が対象 2 flow の契約を、それぞれ実装可能な粒度で確定済み（PR #22）。未解決の design 問題なし。実装方式の残余自由度（文言・duration / id 裁定・per-dialog disposition・硬化 prop の組）は本 packet の D-A〜D-E で確定した。

## 起票時実測(2026-09-01、HEAD 99cf829)

Explore subagent による design phase 実測（2026-08-30、HEAD 7485f92）の全数再検証。**7 項目すべて旧実測と一致**、PR #23 / #24 の対象 file への影響は `RootLayout.tsx` の data 属性 1 行と `StocktakePage.tsx` の returnTo 2 行のみで、Toaster 設定・dialog 領域はいずれも無変更:

- 取引先追加 toast なし: `CreateSupplierDialog` 2 実装（products 版 :45-47 / suppliers 版 :45-47）とも sonner import 自体なし。差分は `onCreated` の引数（products 版のみ supplier を渡す）と Action button type のみ。
- 行確定 toast なし: `PriceRevisionTable.tsx:52-57` の `onSuccess` は入力 clear のみ。「最近改定」badge は mutation 成否と独立の派生表示。
- dialog 12 件の variant / cancel 文言 / DOM 順: D-C 表のとおり。`variant="destructive"` は 3 件のみ、cancel 文言は「キャンセル」9 /「やめる」/「戻る」/「編集を続ける」。DOM 順は全件 Cancel → Action（`AlertDialogFooter` の `flex-col-reverse sm:flex-row` で narrow 視覚反転 — DSR-20 が意図された挙動と明記済み）。
- UnsavedChangesDialog: `onOpenChange` 非配線の暗黙硬化のまま（明示 prop・意図 comment ともになし、file 37 行 comment ゼロ)。
- CostDiffDialog: `showCloseButton={false}` + `onPointerDownOutside` / `onEscapeKeyDown` preventDefault + 意図 comment（:84-95）— 参照実装としてそのまま使える。
- Toaster: `RootLayout.tsx:69` `duration={3000}` 全体既定。toast id 未付与 site は旧記載（3 件）より広く 20 site 超（PLU 書出し 7・backup 5・閾値 3・取込み flow 系ほか）— DSR-19 上の違反ではなく Non-scope に記録。

## Contract Probe

是正仮適用の end-to-end: Writer は実装後、(1) RTL で「取引先追加 dialog 入力 → 追加成功 → toast 表示 + dialog 閉鎖 + 一覧再取得」の一連を T1 で通す。(2) `UnsavedChangesDialog` について、明示 prop 適用**前後**で Esc keydown / 外側 pointer-down の挙動が同値（閉じない・callback 非発火）であることを実測してから T10 の oracle を確定する — Radix AlertDialog の primitive 既定（外側クリック非 dismiss / Esc は onOpenChange 経由）に依存する部分があるため、机上の prop 組で確定しない。probe が primitive 挙動と衝突した場合は実装を止めて Coordinator へ報告する。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| SPEC-SUP-D11（追加成功 toast、2 実装） | CreateSupplierDialog ×2 | T1 / T2 / T3 | L3-1 |
| SPEC-PRV-D8（行確定 toast、商品名） | PriceRevisionTable | T4 / T6 | L3-2 |
| DSR-19 duration 階層（3000 既定 / 5000 重要情報） | Scope 1〜2 | T1 / T4（duration assert） | L3-1 / L3-2 |
| DSR-19 toast id 基準（商品単位置換・別商品個別） | PriceRevisionTable | T5 | L3-2 |
| DSR-20 variant 統一（是正 7 件） | D-C 表 #2/#4/#5/#6/#7/#8/#9 | T7（7 dialog 個別 assert） | L3-3 |
| DSR-20 非 destructive の保護（#3 / #11） | 変更なし | T8（default 維持の対 oracle） | — |
| DSR-20 cancel 文言（既定「キャンセル」） | ProductImportPreview / BackupRestorePage | T9（新文言 exact + 旧文言 0 の対 oracle） | L3-4 |
| DSR-20 硬化手段 1 系統（明示 prop + comment） | UnsavedChangesDialog | T10 / T11 + comment 実在の diff review | L3-5 |
| 隣接: DSR-20 DOM 順（Cancel → Action、変更しない） | 変更なし | 既存 test regression + T7 で順序非接触 | — |
| 隣接: DSR-03（失敗時は toast でなく行内 error / Alert） | 変更なし | T3 / T6（negative） | — |
| 隣接: CostDiffDialog（参照実装、非変更） | 変更なし | 既存 test regression | — |
| 隣接: 既存 toast 文言・duration・id | 変更なし | 既存 test 無変更 green（T12） | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-01-dsr19-20-runtime-batch.md](test-matrices/2026-09-01-dsr19-20-runtime-batch.md)

- targeted tests: 取引先追加 toast 2 実装（T1 / T2）、行確定 toast + duration / id（T4 / T5）、variant 是正 7 dialog 個別（T7）、cancel 文言対 oracle（T9）、硬化挙動同値（T10 / T11）
- negative tests: 追加失敗・行確定失敗で toast なし（T3 / T6）、非是正 dialog の default 維持（T8）
- compatibility checks: 既存 test 無変更 green（T12、正当更新は Scope 6 条件で除外列挙）、bindings 差分ゼロ（AC6）
- data safety checks: synthetic fixture のみ
- main wiring/integration checks: RTL 実 render での toast 発火（sonner mock は呼出し引数 assert まで、文言・duration・id を literal 転記で検証）
- Human Gate に L3 を含むため、Writer 完了条件に `cargo check --release` を含める（CI gate ではない — release build blind spot 対策)

## Boundary / Wire Contract

- producer / consumer / wire type: 変更なし。Tauri command / DTO / generated bindings / JSON wire shape に非接触（AC6 で機械確認）
- toast 契約: sonner 2.0.7 の `toast.success(message, { duration?, id? })` 既存 API のみ使用。新規依存なし
- primitive 挙動: 明示 prop の組は確定済み — `onEscapeKeyDown` のみ（`AlertDialogContentProps` が `onPointerDownOutside` / `onInteractOutside` を Omit。外側クリックは primitive 既定で非 dismiss、gated amendment 2026-09-01）
- invalid input: なし（表示層のみ、入力検証の変更なし）
- compatibility: toast 追加は加算的変更。variant / 文言変更は表示のみで操作手順・DOM 順不変

## Review Focus

- disposition table の全数性と裁定妥当性（12 件の分類が DSR-07 境界と整合するか。特に #3 / #11 の default 維持判断 — 反証があれば Plan Review で挑戦すること）
- toast oracle の独立転記（文言・duration・id の期待値を production 定数から導出しない — SSOT 共有の mutation 感度自壊の型）
- T5 の弁別性（id を固定文字列化する mutation を「別商品で別 id」case が kill できるか — 空集合 oracle 衝突回避、非空期待を最低 1 case）
- T7 の 7 dialog 個別 assert（combined 1 本にしない — 1 dialog 漏れ mutation の検出）
- T9 の対 oracle（新文言 exact 存在 + 当該 button の旧文言 0 hit。「戻る」は「前の画面へ戻る」等の正当用例が repo に多数あるため component 単位で scope すること）
- 硬化明示化の挙動同値（T10 が適用前後で同じ oracle を通ること — Contract Probe (2) の実測記録を PR body に残す）
- 既存 dialog test の variant / class 固定値アサートの扱い（正当更新は列挙 + 弱体化不可、T12 対象からの除外を明示）

## Spec Contract

Contract ID: SPEC-DSR1920-RUNTIME-2026-09-01

- 取引先追加（2 実装とも）の成功時に、取引先名を含む完了 toast を全体既定 duration（3000ms）・id なしで出す
- 価格改定の行確定成功時に、対象商品名を含む完了 toast を duration 5000ms・商品単位の安定 id で出し、別商品の連続確定を同じ id で潰さない
- destructive 確認 dialog の実行 Action は D-C disposition table のとおり 10 件を `variant="destructive"` とし、#3 / #11 は default を維持する
- 対象 2 dialog の cancel 文言を既定「キャンセル」とし、「戻る」「やめる」を残さない
- UnsavedChangesDialog の硬化は明示 prop + 硬化条件 (b) の意図 comment で表現し、Esc / 外側クリックで閉じない挙動を変えない
- 既存 toast の文言・duration・id、dialog の DOM 順・dismiss 配線は変更しない

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-SUP-D11 | Scope 1 | T1 / T2 / T3 | oracle 独立転記 | Matrix |
| SPEC-PRV-D8 + DSR-19 id/duration | Scope 2 | T4 / T5 / T6 | T5 弁別性 | Matrix |
| DSR-20 variant（D-C） | Scope 3 | T7 / T8 | 全数性・個別 assert | Matrix |
| DSR-20 cancel 文言（D-D） | Scope 4 | T9 | 対 oracle の scope | Matrix |
| DSR-20 硬化手段（D-E） | Scope 5 | T10 / T11 | 挙動同値・probe 記録 | Matrix + PR body |
| 既存 regression | 変更なし | T12 | 正当更新の列挙 | PR body |

## Data Safety

synthetic fixture のみ使用（test は既存 mock command 応答、L3 は owner 手元の開発 DB）。実店舗の商品・取引データを test にも docs にも commit しない。

## Human Gate（owner Windows native L3）

L3 項目（既存開発 DB で実施可能 — 取引先・商品・棚卸し等の既存 synthetic データで足りる。新規 fixture 前提なし〈記録済み gap との突合済み: 本 batch の対象 flow に producer gap はない〉）:

- L3-1: 取引先管理画面と価格改定内「新しい取引先を追加」の両経路で取引先を追加 → 取引先名入りの完了 toast が右下に出る。
- L3-2: 価格改定で 2 商品を連続で行確定 → 商品名入り toast が出て、2 件目が 1 件目を潰さず読める（5 秒表示）。
- L3-3: 代表 destructive dialog 3 件（商品の廃番確認 / 棚卸し確定 / 商品取込みの上書き実行）の実行 button が赤系の destructive 表示で、Cancel と取り違えない見え方になっている。代表 3 件で足りる根拠: 是正 7 件はいずれも同一 primitive（`AlertDialogAction` / `Button`）への `variant="destructive"` 付与のみで custom className 差分がなく（起票時実測）、PR #15 型の CSS 詳細度差異が生じる余地がないため（Plan Review round 1 P3-1）。
- L3-4: 商品取込み preview と控え復元確認の cancel button 文言が「キャンセル」。
- L3-5: 未保存編集の確認 dialog が Esc / 外側クリックで閉じない（従来同様）。

## 発注・レビュー段取り

- Writer: Codex（発注書は plan-approved 後に Coordinator が作成、worktree isolation）。
- Plan Reviewer: Sonnet subagent（fresh context、P1/P2 = 0 で plan-approved）。
- Final Reviewer: Sonnet subagent 別個体 + Coordinator が Matrix 記載の mutation を clean tree で独立再実測。
- hosted final: non-doc R3 のため Ready 化で自動 run。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Plan Review / Final Review の記録は本節へ append-only で追記する。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review rally 記録（2026-09-01、append-only）

- round 1（Sonnet 独立 reviewer、対象 = plan-first commit `5d7abb3`）: P1 1 / P2 1 / P3 3。観点 2（前提事実 — 起票時実測の file:line 全数突合）は指摘なし。
  - P1-1 **採用**: D-A の「suppliers 版は呼出し元で名称を確保」は誤り — 両実装とも `submit()` 内の `trimmed` で toast が完結し、caller 変更（Scope 外 file）を誘発する記述だった。Coordinator が `CreateSupplierDialog.tsx`（suppliers 版 :33,45）と `SupplierManagementPage.tsx:66-72`（`onCreated` は refetch のみ）を実読裏取りし三点一致。D-A を dialog 内完結の記述へ是正。
  - P2-1 **採用**: AC3 の裸 `rg 'variant="destructive"'` は `<Alert variant="destructive">` 混入で期待値 10 にならない（Coordinator 実測: repo 全体 56 hit）。機械確認の正を T7 / T8 の per-dialog assert とし、rg は対象 file への path filter 付き目視補助へ是正。
  - P3-1 **採用**: L3-3 の代表 3 件サンプリング根拠（是正 7 件が同一 primitive `AlertDialogAction` / `Button` への variant 付与のみで custom className 差分なし — reviewer 実読）を Human Gate 節に明記。
  - P3-2 **記録のみ**: Non-scope の「20 site 超」は spot check と大きく矛盾しないが精密カウントではない — retrofit しない結論に影響なしのため数値主張は現状維持（起票時実測節に Explore 実測の粒度を明記済み）。
  - P3-3 **採用**: 節順を `docs/templates/plan-packet.md` の正順（Data Safety → Implementation Results → Review Response）へ整列、`Implementation Results` placeholder を追加。
- round 2（別個体 Sonnet の独立再検証、対象 = 是正 commit `859b124`）: 検証 6 項目（P1-1 是正の実装事実整合 / P2-1 是正の実行可能性 / P3-1・P3-3 適用 / 是正 diff の regression なし・Matrix 完全無変更 / doc-check exit 0 実行確認 / 残余 P1/P2 再走査）すべて PASS、P1/P2 = 0、plan-approved へ異論なし。新規 P3 1 件を append-only 訂正として記録: round 1 記録中の「repo 全体 56 hit」は `src/` scope の実測値（`rg -n 'variant="destructive"' src/` = 56。repo 全体は docs 含め 85）— AC3 本文の結論（T7/T8 per-dialog assert が正）に影響なし。

Phase 遷移記録（state-only commit `3aff0c4` で materialize）: `plan-gate -> plan-approved -> implementing`。Plan Review rally は round 2 で新規 P1/P2 = 0 に収束。Plan Commit を `5d7abb3` で確定（plan-first commit は全 content commit の先頭にあり PK5 ancestry を充足する）。次は Codex 発注（Writer content commit、worktree isolation）。

### Final Review 記録（2026-09-01、append-only）

- Writer 停止 1 回（fail-closed、正動作）: `AlertDialogContentProps` が `onPointerDownOutside` / `onInteractOutside` を型レベルで Omit しており D-E 当初の明示 prop 契約と衝突。Coordinator が型定義（`node_modules/@radix-ui/react-alert-dialog/dist/index.d.ts:23`）を実読裏取りし、Matrix M5 が起票時から予見していた逃げ道どおり gated amendment `2433199` で D-E / Boundary / M5 を確定（`onEscapeKeyDown` のみ明示 + 外側クリックは primitive 既定の非 dismiss を T10 regression oracle で固定）。primitive/wrapper 拡張案は Scope 外 + 存在しない dismiss 経路への handler 追加のため不採用。
- Writer content commit `032b75d`（Codex、24 file、worktree isolation）。Writer L1 full PASS（evidence の所在は PR body を正とする）、bindings diff 0、review-only closure P1/P2 = 0。Draft PR #25。
- Coordinator mutation 独立再実測（main tree の detached HEAD = `032b75d`、clean tree、commit 後）: M1〜M5 を Matrix どおり注入し全件 kill を確認 — M1 は suppliers 側 T1 のみ fail で products 側 green（2 実装の個別性成立）、M2 は T4 + T5 の 2 件 fail、M3 は `data-variant="destructive"` assert で fail（正当 oracle）、M4 は T9 で fail、M5 は literal contract case で fail（挙動が暗黙硬化と同値のため、gated amendment 後の Matrix どおり literal oracle が正）。全注入は checkout 復元し tree clean を確認。
- Final Review round 1（Sonnet 独立 reviewer 別個体、対象 = `032b75d` + amendment `2433199`）: P1/P2/P3 = 0。検証 8 点（Scope 完全性 / AC 突合 / 契約逐条 / oracle 独立転記 / 既存 test 扱い / Matrix 対応実在〈T1〜T12 対応表を作成、全件実在〉/ 回帰リスク / コード品質）全 PASS、Goal Invariant 充足 = yes。amendment が Coordinator 指示の 3 編集に限定されていることも独立確認。非ブロッカー所見 1 件（T10 の source 文字列 test が formatter 変更に脆い）は closeout で backlog 起票する。

Phase 遷移記録（本 state-only commit で materialize）: `implementing -> local-verified -> independent-review -> human-confirm`。Writer L1 full PASS + Coordinator mutation 全 kill + Final Review round 1 収束（P1/P2 = 0）により通過。Reviewed Content HEAD を `032b75d` で確定し、`Amendments` に `2433199` を追記。残りは owner Windows native L3（L3-1〜L3-5）、Ready 承認、hosted final、merge。exact-HEAD evidence は D-035/D-038 どおり PR body を正本とする。
