# Plan Packet: アプリの MSI の配布・更新・前の版へ戻す手順を docs にする

wave に属さない単独の lane（2026-10-17 に同時に起票した 6 本の 1 本。docs だけ）。v1.0 の gate の 1 つ「MSI 配布手順 docs 化」（`docs/backlog.md` の同名の項目）を、店の Windows 11 Home の PC へアプリの MSI を入れる・更新する・前の版へ戻す手順として置く。

規模と手法（起票の最初に数えた）: 触る file は 3（新しい手順書 `docs/msi-distribution-runbook.md`、`docs/PROJECT_HANDOFF.md` の案内の 1 行、`docs/backlog.md` の MSI の項目）と本 packet。設計正本（function-design・db-design・SCREEN_DESIGN）・画面・migration・wire の型は 0。範囲・0・失敗の順序・単位の混在のような横断の約束がかかる経路は無い（手順書は既存の契約〈MNT-03-D11、22 §16 の回復、71・68 の backup〉を引いて並べるだけ）。手法: 1 lane のまま。横断の約束の表は作らない。

## Workflow State

- Phase: plan-gate
- Risk: R2
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（GPT-6.1 Sol / high。`.local` の model の選び方の「R2 以下の Plan Review」の行）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Reviewer: fresh Opus 5.5（Claude 側、R2。本 lane は設計の判断を足さない手順書の lane で design lane に当たらないと Coordinator が判断した）+ Codex（GPT-6.1 Sol 既定）。座組表どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/msi-distribution-docs

遷移の記録:

1. kickoff → spec-check（2026-10-17、起草役）: 発注書 368 の Scope（手順書の置き場と 4 つの流れ、更新のときの DB の安全、未確認の点の確かめ方）を範囲にし、Risk を R2 と記録した（下の Risk）。
2. spec-check → design（2026-10-17、起草役）: 引く正本（22 §3.2 MNT-03-D11、22 §16 の回復、71 §71.4・§71.5・§71.9、68 §68.4）は振舞いの契約として足りるが、配布・更新・戻す流れを 1 つに並べた管理者の手順が無い（`docs/migration-recovery-runbook.md` は v8 から戻す手順だけ）。手順書を新しく置く。
3. design → plan-draft（2026-10-17、起草役、同じ commit）: 条件「設計の出力が正本にある」は、手順書 `docs/msi-distribution-runbook.md` を同じ plan-first の変更に置いて満たす（docs だけの lane の先例 `docs/archive/plans/2026-10-17-unit-redesign-design.md` と同じ形）。条件「未解決の設計の問いが無い」は、実機でしか分からない点（M1〜M9）を手順書に「未確認」と書き、結果で変わる所を表に置いたことと、製品名と upgrade code の固定を初回の導入の前提として本 lane の外の項目（backlog）に出したことで満たす。製品名を何にするかは owner の問い（下の Review Focus の Q1）で、本 lane の手順書は名を引かずに書いてあるので答えを待たない。
4. plan-draft → plan-gate（2026-10-17、Coordinator）: packet と手順書は起草役の commit（`1ef45cbd`）にある。Coordinator は手順書の全文と packet の全文（Goal の失敗定義・Ordinary Operation・Scope と所有表・AC・Design Readiness・Contract Probe・Data Safety）を読み、流れ 5 が DB の版の上がり方と入力の前後で分かれていること、未確認の振舞いが M1〜M9 に揃っていること、差分が docs の 4 file だけで店の運用の細部や実データが無いことを確かめた。手順書を plan-first の commit に置く形は docs だけの lane の先例どおりとして採る。Plan Review round 1 へ出す。

## Owner Effort Budget

- 介入回数上限: 9（既定の 6 から owner が改定、repo 外の回答台帳 TD-296 の 5a）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 9 | 0（2026-10-17、起票の時点） | 2（Ready 1・merge 1） | 7 | 9 = 0 + 2 + 7 |

Q1（製品名）は本 lane の完了に要らない（後続の設定の lane の問い）ので、本 lane の介入に数えない。予行演習（M1〜M9）の L3 は後続の項目で、本 lane の介入に数えない。

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R2

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R2 の行「docs change that affects maintainability but not runtime contracts」に当たる。code・設定（`src-tauri/tauri.conf.json` を含む）・DB・command の DTO・画面・merge gate を変えない。R3 との境の規則（stable contract・data safety boundary に触れるなら R3）も見た: 手順書は DB の file を動かす手順（前の版へ戻す）を含むが、その手順は 22 §16 の回復と `docs/migration-recovery-runbook.md`（R4 の lane で review 済み）を引くだけで、新しい data safety の契約を足さない。v8 より後の migration から戻す手順は一般化せず、「その migration の 22 の節に戻す手順が無ければ DB を戻さない」と安全側に倒した。required gate の green / red は変わらない（docs だけで、`scripts/ci/classify-changes.sh` の workflow の一覧〈AGENTS・CLAUDE・DEV_WORKFLOW・ci・MANUAL・code_review・review-checklist・project-profile・agent-guidance・templates ほか〉に当たる path が無い）。Final Review Minimum は 1。

## Goal

Goal Invariant:

### 最小完了条件

- owner が `docs/PROJECT_HANDOFF.md` から辿れる 1 つの手順書で、MSI を作る・初回に入れる・更新の前に backup を取る・更新する・前の版へ戻す、を順に実行でき、各手順で何を確かめるか、止まったら何をするかが分かる。
- 実機で確かめていない振舞いは「未確認」と書かれ、確かめ方（予行演習の項目）と結果で変わる所が手順書にある。

### 失敗定義

- 新しい版で migration が当たった後に、前の版の MSI を入れるだけで戻せるように読める（前の版は起動を止める。MNT-03-D11）。
- 起動時の自動の backup や新しい版で作った backup で前の版へ戻せるように読める（71 §71.9）。
- 実機で確かめていない MSI の振舞い（更新でデータが残る、古い版で上書きできる、アンインストールでデータが残る等）を確かめた事実として書く。
- 店の運用の細部や店のデータを repo に書く。

### 非目的

- `tauri.conf.json` の設定（製品名・upgrade code・版・署名・WebView2 の導入方法）を変える（後続の lane）。
- 予行演習（M1〜M9）を本 lane で行う（owner の手が要り、後続の項目で 1 回にまとめる）。
- 自動更新・署名の導入・Windows の CI build。
- `docs/migration-recovery-runbook.md` と 22 §16 を一般化する・書き換える。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

管理者（owner）の作業の列。アプリの中の操作は変えない。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 配布する commit が決まった | 開発用の Windows の clone で流れ 1（`npm ci --ignore-scripts` → `npm run tauri build` → SHA-256） | 配布する MSI と配布の記録の 1 行 | MSI が見つかり記録が書けた | M1（file の名前と場所） |
| 店の PC にアプリが無い。製品名と upgrade code が固定済み、予行演習済み | 流れ 2（写す → SHA-256 を照らす → 入れる → 起動 → 手動バックアップ） | 店の PC でアプリが起動し、DB と backup ができている | ホームが出て backup が 1 つある | M2（UAC・入る場所）、M3（SmartScreen）、M9（WebView2） |
| 前の版が動いている | 流れ 3（前の版で手動バックアップ → 2 か所へ写す → アプリを閉じる） | 前の版で開ける backup が PC の内と外にある | 写しが 2 か所にある。失敗したら更新しない | なし（既存の 68・71 の機能） |
| 流れ 3 が済んだ | 流れ 4（新しい MSI を照らす → 入れる → 起動 → 確認） | 新しい版で前のデータが見える | 起動の後の確認が済んだ | M4（置き換えとデータの残り）、M8（動いたままの更新） |
| 翌日以降に不具合が見つかった | 流れ 5（入力の前か後か、DB の版が上がったかで分け、MSI を入れ直すか runbook の 7 手順） | 前の版で、更新の前のデータが開ける。入力の後なら owner が前進か入れ直しかを決める | 前の版が起動する | M6（古い版の上書き）、M7（アンインストール） |

この lane で完了するのは「手順書が置かれ、owner が辿れる」まで。店の PC への初回の導入は、製品名と upgrade code の固定と予行演習（backlog の 2 項目）の後で、v1.0 の通常運用の達成はそれらを含む。

## Scope

- `docs/msi-distribution-runbook.md`（新規）: 今の事実の表（出所つき。Tauri の公式の資料は 2026-10-17 に確かめた URL を各行に）、初回の導入の前に決めること、配布の記録の欄、流れ 1〜5、確かめる項目 M1〜M9。
- `docs/PROJECT_HANDOFF.md`: 案内の表に手順書の行を 1 行足す（template の Registration / Generation Obligations「source / workflow doc 新設」）。
- `docs/backlog.md`: 「MSI 配布手順 docs 化」の項目の下に、本 lane の起票と、残る 2 項目（製品名と upgrade code の固定、予行演習）を足す。他の行は変えない。

型・JSON・関数・DTO の形は変えない（作る所・読む所・fixture・test の呼び方の列挙は不要）。

他の lane との所有（`docs/DEV_WORKFLOW.md` Wave Operation）:

| file | 節 | 所有 |
|---|---|---|
| `docs/backlog.md` | 「MSI 配布手順 docs 化」の項目とその下の箇条 | 本 lane |
| `docs/backlog.md` | それ以外の項目（日報の紙、SD の一括取込み、単位の語の直し、JAN の別名、SD 直読みの runtime の各項目を含む） | 各 lane（本 lane は触らない） |
| `docs/PROJECT_HANDOFF.md` | 案内の表の手順書の行 | 本 lane（他の 5 本の発注書に PROJECT_HANDOFF は出ない。`rg` で確かめた） |

## Non-scope

- `src-tauri/tauri.conf.json`・`Cargo.toml`・`package.json` の変更（製品名・upgrade code・版・署名・WebView2）。
- `docs/migration-recovery-runbook.md`・`docs/function-design/22-mnt-migration.md`・71・68 の変更。
- `docs/DEV_SETUP_CHECKLIST.md` §4.6（「Phase 2 完了時に MSI ビルドを生成して動作確認」の旧い記述は履歴として残す）。
- 予行演習の実施、店の PC での導入。
- `docs/decision-log.md`（新しい決定は無い。手順書の手順は既存の契約の並べ方で、durable な判断を足さない）。

## Acceptance Criteria

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0（`結果: 全チェック通過`）。起票の前の baseline（2026-10-17、本 branch の起点 `f5d7aaf4`）: 全チェック通過、WARN 0。
- AC2: `bash scripts/doc-consistency-check.sh --target plan` が exit 0。
- AC3: `rg -n 'msi-distribution-runbook.md' docs/PROJECT_HANDOFF.md docs/backlog.md` が両 file で hit する。baseline（起点 `f5d7aaf4`）: hit 無し（`rg exit=1`）。
- AC4: `rg -n '^## ' docs/msi-distribution-runbook.md` が「今の事実」「初回の導入の前に決めること」「配布の記録」「流れ 1」〜「流れ 5」「確かめる項目」を出す。baseline: file が無い（`rg exit=2`）。
- AC5（読んで確かめる）: 手順書の「未確認（M*n*）」がすべて「確かめる項目」の表の行を指し、表の各行に確かめ方と結果で変わる所がある。流れ 5 が「新しい版で DB の版が上がったら MSI の入れ直しだけでは戻せない」と「前の版で作った backup を使う」を書いている（Goal の失敗定義の 1・2 行）。

## Design Readiness

- 引く設計正本（節まで）: 22 §3.2 MNT-03-D11（新しすぎる DB の拒否と回復）、22 §16 の「回復」7 手順と vU・vB の「止まった後の進め方」、`docs/migration-recovery-runbook.md`（22 §16 の写し）、71 §71.4（backup の file 名）・§71.5（保持日数での削除）・§71.9（起動時の自動の backup が migration の後）、68 §68.4（手動バックアップ・実効保存先）。
- 必要な設計成果物: Design artifact selection の当たる行は無い（振舞い・command・DB・画面・format を変えない）。管理者の手順書を新しく置く（updated in this PR、`docs/msi-distribution-runbook.md`）。
- plan にしかない durable な判断の昇格先: 無い。手順書の安全側の手順（予行演習の後に初回の導入、backup が失敗したら更新しない、v8 より後の戻す手順が無ければ DB を戻さない）は手順書に置く。
- 前提・制約と延期した gap: 実機の MSI の振舞い M1〜M9 は未確認で、予行演習（backlog）へ延期する。延期しても安全な理由: 手順書は未確認の点を手順の前提にせず、予行演習の前に店の PC へ入れないと書いている。製品名と upgrade code の固定は設定の lane へ延期（初回の導入の前提）。
- 絶対保証の自己点検: 手順書の「データは変わっていない」は MNT-03-D11 の「論理内容を変えない」を引く（SQLite の open による物理的な書込みは 22 §3.2 の同じ節が扱う）。「前の版は今の DB を開けない」は DB の版が上がった場合に限って書いた。
- 判定: ready。

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| source / workflow doc 新設 | 親文書の目次・索引を更新 | `docs/PROJECT_HANDOFF.md` の案内の表に 1 行（Scope） |

ほかの行（Tauri command、function-design doc、REQ、route、operator 画面）は該当なし。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | 外部の adapter と app-core の境 | Architecture | 不該当: レジ・POS の adapter に触れない | なし |
| Fact check / design decision split | 観測した事実とアプリの判断の分け | 手順書の「今の事実」 | 当たる: repo の現物と Tauri の公式の資料で確かめた事実を出所つきで表にし、実機の振舞いは M1〜M9 の未確認に分けた | 予行演習（backlog） |
| Lifecycle / retry | 前・中・後・失敗の後 | 手順書の流れ 3〜5 | 当たる: 更新の前の backup、起動の拒否、migration の後の戻し方を、入力の前・後と DB の版の上がり方で分けた | なし |
| Operator workflow | 実際の順序 | 手順書 | 当たる（管理者の作業）: 作る → 入れる → backup → 更新 → 戻す の列。店の利用者の操作にしない | なし |
| Replacement path | 外部の系が変わったとき | — | 不該当: installer の方式（MSI）を変える判断は無い | なし |
| Data safety / evidence | 店のデータを repo に入れない | 手順書の「配布の記録」と M の表 | 当たる: 配布の記録は repo の外、予行演習は試験用のデータだけ | なし |
| Reporting / accounting semantics | 集計の意味 | — | 不該当: 集計に触れない | なし |
| Manual verification | 自動 test で示せない主張 | 手順書の M1〜M9 | 当たる: MSI の振舞いはすべて Windows の実機でしか分からない。後で 1 回にまとめる（owner の手が 2026-10-20 から使いにくい） | 予行演習（backlog） |
| 環境・再現性 | 新しい環境依存の pin | — | 当たる: MSI の build は Windows と WiX に依る。CI に入れず、開発用の Windows の clone で作る（明示的に defer）。Windows の toolchain の pin は本 lane で足さない | なし |

## Boundary / Wire Contract

変えない。JSON・CSV・config・manifest・DTO・bindings・DB に触れない（`src-tauri/tauri.conf.json` は読んだだけ）。

## Test Plan

- targeted tests: 無い（code を変えない）。
- negative tests: AC5 の読み取り（失敗定義の 1・2 行に当たる記述が無いこと）。
- compatibility checks: AC1・AC2 の doc 検査（R3 の Markdown link の実在を含む）。
- data safety checks: `git diff --cached --name-only` で docs の 4 file だけを commit する。手順書と packet に店の運用の細部・金額・商品名を書かない。
- main wiring/integration checks: AC3（案内から辿れる）。

## Review Focus

- Goal の失敗定義の 4 行に当たる記述が手順書に無いか。特に流れ 5 の分け方（入力の前・後、DB の版が上がったか）と、v8 より後の migration の扱い。
- 「今の事実」の表の各行が出所（repo の現物・公式の資料）と合っているか。公式の資料で確かめていない振舞いが「未確認」になっているか。
- 製品名と upgrade code の固定を初回の導入の前提にしたことの当否。
- Q1（owner 向け、後続の設定の lane で聞く。本 lane の完了に要らない）: 店の PC のスタートメニューに出るアプリの名を何にするか。選択肢 a = 今の雛形の名（`inventory-system-tauri-scaffold`）のまま upgrade code だけ固定、b = 日本語の名を owner が決める、c = 英字の短い名を owner が決める。推奨 b（利用者が見つけやすい）。答えが無い間の既定: 店の PC に入れない（手順書の「初回の導入の前に決めること」）。

## Contract Probe

R2 なので必須ではないが、発注書が未確認の点の確かめ方をここに書くよう求めている。実験は Windows の実機が要り、本 run では行っていない。手順書の M1〜M9 と同じ。

- MSI の出来る場所・file の名前・NSIS も出来るか: 開発用の Windows で流れ 1 → 未実施（M1）
- MSI の導入で UAC が出るか・入る場所: 試しに入れる → 未実施（M2）。公式の資料（2026-10-17、Windows Installer の頁）は install mode を NSIS についてだけ書き、MSI の範囲を書いていない
- USB で写した MSI で SmartScreen が出るか: browser を通さない file で入れる → 未実施（M3）。公式の資料（同日、code signing の頁）は「browser から download したとき」の警告を書く
- 版を上げた MSI の置き換えとデータの残り、製品名を変えたときの並び: 版 A → 版 B → 未実施（M4）。upgrade code が `productName` から作られることは公式の資料（同日、config の WixConfig）で確かめた
- 同じ版の再導入: → 未実施（M5）
- 古い版の上書き: `allowDowngrades` の既定 `true` は公式の資料（同日、config の WindowsConfig）で確かめた。実際の上書き → 未実施（M6）
- アンインストールでデータの folder が残るか: → 未実施（M7）。公式の資料（同日、Windows Installer の頁）に記述が無い
- 動いたままの更新: → 未実施（M8）
- 店の PC の WebView2: 店の PC で見る → 未実施（M9）

## Data Safety

- commit しない: 店の DB・backup・MSI・配布の記録・ログ。
- repo の外にだけ置く: 配布の記録（管理者の保管場所）。
- 試験用だけ: 予行演習のデータは `seed_demo_data` の決定的な試験データ。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
