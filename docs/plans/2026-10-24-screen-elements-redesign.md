# Plan Packet: 画面ごとの要素の見直し（商品・在庫を探す・見る・直す画面）

wave に属さない単独の lane（design lane、docs だけ。画面の code は変えず、設計が決まった後の実装は別の lane）。owner の所感（repo 外の回答台帳 TD-413・TD-415、2026-10-24、PR #191 の L3 の途中。原文は台帳にあり、公開 repo には書かない）を起点に、商品・在庫を探す・見る・直す画面が、それぞれどの要素（検索の道具・初めて開いたときに出るもの・一覧の列・行き先）を持つかを一旦並べ直して整える。進め方は棚卸しの数の置き場の design lane（D-118、`docs/archive/plans/2026-10-16-stocktake-count-placement-design.md`、repo 外の回答台帳 TD-258）の型に寄せる: 段 1 で今の画面の事実だけを集め、段 2 で白紙の骨組みを組み、段 3 で今の設計と突き合わせて owner が採否を決め、その結果を正本へ置き換える。決定の番号は D-138（Coordinator が割り振った。段 3 で owner が採否を決めた後に decision-log へ置く）。本 lane の branch は `agent/screen-elements-redesign`（起点 main `843c4938`）。

着手の順: 店の PC への導入の前の関門ではない。並走の製品の lane（棚卸しの b1・b2 ほか）が今の画面を触っているので、本 lane は docs だけで進め、画面の code・設計正本の文を段 1・段 2 では変えない。

本 run（起票）でやったこと: 起票と段 1（事実を集める）まで。段 2 以降は後の run。

段 2 の run（2026-10-24）でやったこと: 段 2 の白紙の骨組み（`## 段 2: 白紙の骨組み`）と、段 3 の入力の整理（同 2.8）。正本と画面の code は変えていない。段 3（owner の採否と正本の置換え）は後の run。

段 2 の直しの run（2026-10-24）でやったこと: 相談役の反例探しを Coordinator が受理した 7 点で段 2 を直した（QU-004 の出所の範囲、Q-1 の d、案 A の失うもの、大きさの見込み、K-5 の限定、原則の伸ばしの限定、案 C の位置づけ）。正本と画面の code は変えていない。

## Workflow State

- Phase: design
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3・design lane）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/screen-elements-redesign

遷移の記録:

1. kickoff → spec-check（2026-10-24、起草役）: owner の所感（TD-413・TD-415）を受けた Coordinator の発注で、対象を「商品・在庫を探す・見る・直す画面の要素の見直し」とし、段 1〜段 3 と置換えまでを本 lane の範囲にした。Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-24、起草役、同じ commit）: 触る正本は `docs/SCREEN_DESIGN.md`（§1 画面一覧、§3 の在庫照会・商品検索・一覧・入出庫履歴ほか、§4「在庫照会のREQ統合」）、`docs/function-design/` の 50・53・58・61〜66・67・73・77、`docs/design-system/02-component-catalog.md` の ⑥・⑨・⑮、D-047 と `docs/function-design/52-ui-shared-layout.md` の UI-12-D1。在庫照会の契約 I（58 §58.10）と商品一覧の UI-01a-D1（50 §50.2）が「初めて開いたときに何を出すか」を画面ごとに逆に決めており、owner の所感がその片方を問うので、設計の更新が要る（design へ進む）。設計の中身は段 1〜段 3 で作る。design → plan-draft は段 3 で owner が採否を決め、正本の置換えの文ができてから。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（起票の時点。TD-413・TD-415 は起票の前の所感で、本 lane の介入に数えない） | 4（段 3 の採否 2〈画面の割り当て・初めて開いたときに出すもの〉、Ready 1、merge 1） | 2 | 6 = 0 + 4 + 2 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
本 lane は docs だけだが、段 3 の結果で置き換える正本が、route / search state（在庫照会の `status`・`q`・`page`、商品一覧の search params、サイドバーの deep-link、`returnTo`）と operator workflow（どの画面で商品を探し、初めて開いたときに何が出るか）の契約を持ち、後続の runtime がそれを写す。Risk Tiers の R3 の行（route/search state、operator workflow）に当たり、「R2 と R3 で迷えば、UI の route/search の振舞いに触れるなら R3」にも当たる。先例の docs だけの design lane（D-118、`docs/archive/plans/2026-10-16-stocktake-count-placement-design.md`）も後続の runtime が写す契約を決めるので R3 だった。R4 ではない: データを壊す・実店舗のデータを出す・不可逆な操作をせず、docs の差分だけで `git revert` で戻る。DB・Tauri command の DTO・bindings は段 3 の結果しだいで後続の runtime が変える見込みがあり、その lane の起票で Risk を決め直す。Final Review Minimum 1（workflow gate の変更を含まない。classifier の workflow の一覧に当たる path は Scope に無い）。

## Goal

Goal Invariant:

### 最小完了条件

- 商品・在庫を探す・見る・直す画面のそれぞれについて、何のための画面か・検索の道具に何を置くか・初めて開いたときに何を出すか・一覧に何の列を出すか・行からどこへ行けるかが、source docs（`docs/SCREEN_DESIGN.md` と該当の function design、design-system）だけで答えられ、owner が段 3 で採った形になっている。
- 在庫照会を「すべて」で開いて何も出ない形（今の契約 I）を残すか変えるかが、owner の採否として正本に書かれている（変えないなら、その理由と、使い手が何も見えないまま迷わない手当て）。
- 重なる画面の組（段 1 の重なりの一覧）のそれぞれに、統合する・役割を分ける・今のまま、のどれにしたかと理由が書かれている。
- 後続の runtime の lane の Writer が、チャットの履歴と repo 外の資料を見ずに、正本だけで画面の変更を実装できる。

### 失敗定義

- 段 1 の事実を確かめずに（code の現物か正本の片方だけで）骨組みや選択肢を作る。
- owner の採否の前に、画面の code・設計正本の文を書き換える。並走の lane（棚卸しの b1・b2 ほか）が触る画面の code に手を入れる。
- 使い手（店主）に、今より多くの手作業や「どの画面か迷う」場面を残す形を、理由を書かずに採る（AGENTS.md の「使い手に押しつけない」）。
- owner の所感の原文を公開 repo に書く、または Coordinator・subagent の要約を owner の意図として裁定する。
- D-118 の (b)（棚卸し・在庫照会・在庫変動の要再確認の表示）、D-117 の PLU の書出しの見直しの runtime の決定を、本 lane で書き換える。

### 非目的

- 画面の code・test・bindings・migration の変更（後続の runtime の lane）。
- 見た目の刷新（書体・色・余白。デザインの刷新は v1.0 の前に入れる別の作業〈owner の決定 TD-296〉）。
- 売上の画面（日次・月次）、取込み、システム管理の画面の要素の見直し（下の段 1 の「外した画面」）。
- D-118 の (b) と D-117 の runtime の中身（本 lane は、それらが決めた画面の変更と矛盾しない形を選ぶだけ）。
- `docs/Plans.md` の lane ごとの行の追加（D-097。`## 次の行動` の `docs/plans/` への pointer の行が既にある）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

本 lane は operator の操作を決め直す design lane なので、店主の普通の一日のうち本 lane が扱う操作を、今の結果と並べて置く（段 3 で「採った形での結果」の列を足す）。この文書を完了できる（段 3 の採否と正本の置換え）ことと、通常運用を達成できる（後続の runtime の lane が画面を変える）ことは別で、本 lane だけでは後者は達しない。

| 初期状態 | 操作 | 利用者が得る結果（今） | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 開店の前後、発注を考える | サイドバーかホームの「在庫照会」を開く | 一覧は出ず、検索の案内だけが出る（S-03、E-01） | 段 2 で、発注の判断に何を一目で見たいかを店の仕事の流れから組む | 発注の判断を在庫照会で何から始めるか（全体を眺める・部門で見る・在庫少だけ見る）は店の事実。段 2 で台帳を引いた: 発注の準備は発注書を持って棚を回り、欲しいのは取引先別の在庫切れ・在庫少の一覧（L-124・QU-004）。PC で最初に何を見たいかは台帳に無く、段 2 の 2.7 の Q-1 |
| 品物が届いた | 入庫記録で商品を入れて保存し、「在庫照会へ戻る」を押す | 在庫照会が案内だけで開き、入れた商品の在庫は検索し直さないと見えない（S-07、E-02） | 段 3 で戻り先と開いたときの中身を決める | 入庫の後に在庫照会で何を確かめたいか（入れた商品だけか）。段 2 で台帳を引いたが無く、段 2 の 2.7 の Q-2 |
| 商品を直したい | 商品検索・一覧を開いて探し、「修正」を押す | 一覧が初めから出ていて探せる。修正の後は一覧へ戻る（S-02、S-14） | 段 3 で、在庫照会と商品一覧の役割の分け方か統合を決める | なし |
| 在庫照会で商品を開き、商品修正へ進む | 詳細の「商品修正」を押して保存する | 保存の後は商品一覧へ戻り、在庫照会へは戻らない（S-03、S-14） | 段 3 で戻り先を決める | なし |

## Scope

段 1（本 run で済み）:

- 商品・在庫を探す・見る・直す画面の事実の表（下の「段 1: 今の画面の事実」）。画面ごとに、目的・検索の道具・初めて開いたときに出るもの・一覧の列・行から行ける先・重なる画面を、code の現物（route・component・hook・BIZ / IO の検索の関数）と正本の両方で確かめ、`file:line` か節の ID で引く。
- 正本と code の食い違いの表。
- 重なる画面の組と、初めて開いたときに何も出ない所の一覧（解決案は書かない）。

段 2・段 3（後の run。下の「段 2・段 3 の進め方」）:

- 段 2: 白紙の骨組み（本 packet の後半の `## 段 2: 白紙の骨組み`。2026-10-24 の段 2 の run で済み）。
- 段 3: 今の設計との突き合わせと owner の採否の選択肢（本 packet の後半に置く）。採否の後、正本を置き換える: `docs/SCREEN_DESIGN.md`（§1・§2・§3 の対象の画面・§4「在庫照会のREQ統合」）、`docs/function-design/` の 50・53・58・61〜66・67・73・77 のうち採った形が触る節、`docs/design-system/02-component-catalog.md` の ⑥・⑨・⑮ のうち触る所、`docs/decision-log.md` の D-138、D-047 の置換えの行（変えるなら）、`docs/backlog.md` の後続の runtime の項目。段 3 の後に Scope をこの粒度から file の一覧へ詰める。

本 run の差分は本 packet だけ。`docs/Plans.md` は変えない（`## 次の行動` に `docs/plans/` を指す pointer の行が既にあり、D-097 の D6 は lane ごとの行を足さない）。

## Non-scope

- 画面の code・test・bindings・migration（後続の runtime の lane）。
- 売上の画面・取込み・システム管理の画面（段 1 の「外した画面」の理由）。
- D-118 の (b) と D-117 の runtime の中身。
- 見た目の token（色・書体・余白）の変更。
- 並走の lane（棚卸しの b1・b2 ほか）の packet と code。

## Acceptance Criteria

- AC1（段 1）: 段 1 の表が、`docs/SCREEN_DESIGN.md` §1 の画面一覧と `src/routes/` の route のうち商品・在庫を探す・見る・直す画面を全部持ち、外した画面に理由がある。各行の根拠が `file:line`（起点 main `843c4938` の時点）か節の ID で引ける。
- AC2（段 1）: 正本と code の食い違いが `### 正本と code の食い違い` の表にあり、各行に正本の節と code の `file:line` の両方がある。
- AC3（段 1）: 重なる画面の組（`### 重なる画面の組` の O-n）と、初めて開いたときに何も出ない所（`### 初めて開いたときに何も出ない所` の E-n）の一覧があり、解決案を含まない。
- AC4（段 2）: 白紙の骨組みが、店の仕事の流れ（`docs/project-memory.md`・`docs/spec/requirements.md`）と design-system の正本が引く文献だけから組まれ、今の画面の形を前提にしていない。各要素に根拠（文献の原則か店の事実の ID）がある。
- AC5（段 3）: 段 1 の重なりの組と何も出ない所の全部に、owner が選べる選択肢（今のままを含む）と、各案の利点・失うもの・後続の runtime の大きさの見込み（`未実測` を含む）がある。owner の採否が repo 外の回答台帳の ID で引ける。
- AC6（置換え）: 採った形が正本に書かれ、旧い契約（契約 I ほか）の置換えの行がある。`bash scripts/doc-consistency-check.sh` と `--target plan docs/plans/2026-10-24-screen-elements-redesign.md` が ERROR 0。
- AC7: 差分が docs だけ（`git diff --name-only origin/main...HEAD` が `docs/` の下だけ）。公開 repo に店のデータ・owner の原文が無い。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: `docs/SCREEN_DESIGN.md` §1・§2・§3（ホーム・PLU書出し・棚卸し・在庫照会・入出庫履歴・在庫変動追跡・入庫記録・返品・交換・商品検索・一覧）・§4「在庫照会のREQ統合」、50 §50.2〜§50.7、53 §53.1・§53.4、58 §58.1・§58.4・§58.7・§58.10・§58.13、61 §61.5、62・63・64 の product add の行、65 §65.4・§65.8.1、66 §66.2・§66.3、67 §67.5、73 §73.3〜§73.6・§73.15、77 §77.2〜§77.6、52 UI-12-D1、02 の ⑥・⑨・⑮、D-047・D-089。
- 必要な設計成果物: operator workflow / route・search state / empty UI の行 = `docs/SCREEN_DESIGN.md`・`docs/UI_TECH_STACK.md`（触るなら）・対象の UI function design（状態 = 段 3 の後に updated in this PR）。durable な判断の行 = decision-log の D-138（状態 = 段 3 の後に updated in this PR）。BIZ・CMD・DB の行は段 3 の採った形しだい（画面の統合で検索の command を足すなら function design の 30・40 と Boundary / Wire Contract）。
- plan にしかない durable な判断の昇格先: 段 3 の採否は D-138 と各正本の節。段 1 の表と段 2 の骨組みは packet に置き、正本には写さない（archive の packet が経緯を持つ）。
- 前提・制約と、延期した design gap の follow-up: SP-301-01〜03・SP-302-01〜04（在庫照会の仕様の ID）の本文は tracked docs に無い（`rg -n 'SP-301-01|SP-302-01' docs --glob '!docs/archive/**'` の出力 2 行、どちらも ID の引用だけ〈`docs/SCREEN_DESIGN.md` と 58 §58.1〉）。段 2 で REQ の文（`docs/spec/requirements.md` の REQ-103・REQ-301〜303）と店の事実から組み、SP の本文を前提にしない。
- 絶対保証の例外と escape hatch の自己点検: 段 1 では絶対保証を書いていない。段 3 で「何も出ない画面は無い」と書くなら、読込みの失敗・0 件・範囲外の page・商品が 1 件も無い DB の場合を同じ PR で点検する。
- 判定: not ready（段 3 が残る。design に留まる）。

## Registration / Generation Obligations

本 run は該当なし（docs の packet だけ）。段 3 の置換えで function-design の file を新設・改名するなら `src-tauri/tests/design_compliance_test.rs` の `build_doc_to_modules_map()` と親の索引、REQ の参照を増減するなら `cargo run --bin generate_traceability` を Scope に入れる。route の新設・改名・operator 画面の新設・統合は後続の runtime の lane の義務（`npm run generate:routes`、`src/config/navigation.ts` と到達の test）。

## Impact Review Lenses

起点が owner の L3 の途中の所感（operator workflow の気付き）なので当てる。

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 不該当: 外部の system を変えない。検索は既存の BIZ `search_products`・`list_low_stock` の上の画面の話 | なし |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 該当: 段 1 は code と正本の事実だけ。契約 I・UI-01a-D1 は app の決定で、段 3 で採否を決め正本へ昇格する | 段 1 の表、段 3、D-138 |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 一部該当: 読込みの失敗・0 件・範囲外の page の表示（58 §58.8、UI-06a-D3）を、初めて開いたときに一覧を出す形にするなら同じ扱いで点検する | 段 3 の選択肢 |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 該当: 発注を考える・入庫の後に確かめる・商品を直す、の列（上の Ordinary Operation）。店の事実は段 2 で台帳を引く | 段 2 の骨組み |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 不該当: 外部の system を置き換えない | なし |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 該当: owner の原文は台帳の ID だけで引き、店の商品数・商品名は書かない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 一部該当: 「在庫あり」は基準以上を保証しない（58 契約 H）。一覧を出す形で状態の意味が変わらないかを段 3 で点検する | 段 3 の選択肢 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 本 lane は docs だけで L3 は無い。採った形の見え方は後続の runtime の L3 で確かめる（design-system 04 原則 11） | 後続の runtime の packet |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 不該当: 環境依存を足さない | なし |

## Boundary / Wire Contract

本 run は wire を変えない。段 3 で画面の統合や検索の command・route の search params を変える形を採るなら、その時点でこの節を埋める（producer・consumer・wire type・互換）。今の route の search params は段 1 の表の各行が引く zod schema（`src/features/stock-inquiry/types.ts:30-38`、`src/features/products/search.ts:54-69` ほか）。

- producer: 段 3 の後に決める（本 run は変えない）
- consumer: 同上
- wire type: 同上
- internal type: 同上
- precision/range: 同上
- round-trip path: 同上
- invalid input: 同上
- compatibility: 同上

## Test Plan

本 lane は docs だけで、自動 test の追加は無い。Test Design Matrix は段 3 の後（plan-draft への遷移の前）に `docs/plans/test-matrices/2026-10-24-screen-elements-redesign.md` へ置き、採った形の契約ごとに後続の runtime が足す test の行（REQ・節の ID つき）を導く。

- targeted tests: 本 lane は無い。`bash scripts/doc-consistency-check.sh` と `--target plan docs/plans/2026-10-24-screen-elements-redesign.md` を ERROR 0 で通す
- negative tests: 本 lane は無い。段 3 で 0 件・読込みの失敗・範囲外の page を Matrix の行にする
- compatibility checks: 段 3 で、URL の search params の互換（bookmark・`returnTo` の着地、66 UI-06c-D9）を Matrix の行にする
- data safety checks: 差分に owner の原文・店のデータが無いことを目で確かめる
- main wiring/integration checks: 本 lane は無い（後続の runtime の到達の test）

## Review Focus

- 段 1 の表が、code の現物と正本の両方に合っているか（行の根拠の `file:line` と節を開いて確かめる）。外した画面の理由が妥当か。
- 重なりと何も出ない所の一覧に漏れが無いか。解決案が混ざっていないか。
- 食い違いの表に、どちらが正しいかの裁定を書いていないか（裁定は段 3）。
- この変更で不要になる記述・条件は無いか（段 3 の置換えで、契約 I・UI-01a-D1 の「機械的に横展開しない」・D-047 の文が要らなくなる見込みがあるか）。

## 段 1: 今の画面の事実

対象の決め方: `docs/SCREEN_DESIGN.md` §1 の画面一覧（#1〜#21、#12a・#12b）と `src/routes/` の route（`find src/routes -name '*.tsx' -not -name '*.test.tsx' -not -name '-*' | wc -l` の出力 36。`__root` と子 route の layout を含む）と `src/config/navigation.ts` の 22 項目（`grep -c 'status: "active"' src/config/navigation.ts` の出力 22）から、商品か在庫を探す・見る・直す画面を挙げた。行番号は起点 main `843c4938` の時点。

### 対象の画面の表（14 画面）

| # | 画面（route） | 目的（正本） | 検索の道具 | 初めて開いたときに出るもの | 一覧の列 | 行から行ける先 | 重なる画面 |
|---|---|---|---|---|---|---|---|
| S-01 | ホーム（`/`、UI-00） | 朝一の状況把握と各画面への入口（SCREEN_DESIGN §3 ホーム画面、53 §53.1） | なし。件数 3 枚（昨日の売上・在庫切れ・在庫少、`src/features/home/components/SummaryCards.tsx:27`・`:54`・`:74`）。在庫切れ・在庫少は `list_low_stock(false)` を取り（`src/features/home/hooks/useHomeSummary.ts:34`）、在庫 0 以下と在庫ありに分けて数える（`src/features/home/lib/count-stock-status.ts:14-18`）。PLU 未反映は通知バー（`src/features/home/HomePage.tsx:72`） | 件数・通知・入口 card | なし | 件数 card は押しても遷移しない（D-089）。入口 card「在庫照会」は `/stock` を引数なしで開く（`src/features/home/components/QuickActionGrid.tsx:13` → `src/config/navigation.ts:89-97`）→ S-03 の案内。「商品管理」は `/products`（`QuickActionGrid.tsx:14`） | O-2、O-5 |
| S-02 | 商品検索・一覧（`/products`、UI-01a、REQ-103） | 商品管理の入口。既存商品の把握と修正の対象を探す（50 §50.1、UI-01a-D1。SCREEN_DESIGN §3 商品検索・一覧画面） | 検索欄（live、商品コード・商品名・JAN・メーカー品番。`src/features/products/ProductListPage.tsx:111-118`、BIZ の keyword は `maker_code` を含む `src-tauri/src/db/product_repo.rs:853`）、部門（部門の master 全件、UI-01a-D7）、廃番の表示（表示中・すべて・廃番のみ）、PLU の表示（すべて・対象・未反映・反映済み・対象外、`src/features/products/search.ts:20-26`）、並べ替え（商品コード・商品名・在庫数・売価 × 昇順・降順、`search.ts:27-36`）、表示件数 50・100・200（既定 100、`search.ts:129-134`）、ページと件数（`ProductListPage.tsx:281-300` の `ListShell`）。全部 URL に持つ（`search.ts:54-69`） | 廃番以外の商品の一覧（商品コードの昇順、100 件。UI-01a-D1、`search.ts:140-153`） | 商品コード・商品名（廃番の badge と JAN を同じ欄）・部門・売価・原価・在庫数・PLU・操作（`src/features/products/components/ProductTable.tsx:40-49`） | 行の「修正」→ `/products/$code/edit`（一覧の条件を `returnTo` で渡す、`ProductTable.tsx:103-111`）。「商品登録」→ `/products/new`（`ProductListPage.tsx:273`）。絞り込みに一致する全件の「PLU 対象にする / 外す」（`ProductListPage.tsx:216-248`） | O-1、O-4、O-5、O-6 |
| S-03 | 在庫照会（`/stock`、UI-06a、REQ-301・REQ-302） | 商品ごとの在庫数と状態を確かめ、発注の判断から入出庫へ進む（58 §58.1 の主動線「検索欄 → 結果一覧 → 詳細カード展開 → 発注判断」、SCREEN_DESIGN §3 在庫照会画面・§4「在庫照会のREQ統合」） | 検索欄（live、案内の文は商品コード・商品名・JAN。`src/features/stock-inquiry/StockInquiryPage.tsx:107-118`）、部門（master 全件、UI-06a-D2）、表示件数 50・100・200（URL に無いローカルの値、既定 50、`StockInquiryPage.tsx:45`）、状態のチップ すべて・在庫切れ・在庫少（`src/features/stock-inquiry/types.ts:13-17`）。ページは「すべて」だけ（`StockInquiryPage.tsx:251-260`）。件数は「すべて」がページの要約、在庫切れ・在庫少が「全 N 件」（`StockInquiryPage.tsx:227-240`、UI-06a-D6）。並べ替えの道具は無く、「すべて」は商品コードの昇順（`src/features/stock-inquiry/hooks/useStockInquiry.ts:61`）、在庫切れ・在庫少は取引先名 → 在庫数 → 商品名（`src/features/stock-inquiry/lib/filter-low-stock-list.ts:49-66`、UI-06a-D4）。廃番は常に除く（58 §58.10「廃番除外」） | 状態が「すべて」で検索語が空なら一覧を取らず、「商品コード、商品名、または JAN コードで検索してください」だけを出す（`useStockInquiry.ts:50`・`:81`、`StockInquiryPage.tsx:177-178`、`src/features/stock-inquiry/components/EmptySearchPlaceholder.tsx:9`。58 §58.10 契約 I）。部門だけを選んでも同じ（`isAllEmpty` は部門を見ない、`useStockInquiry.ts:50`） | 商品コード・商品名・部門・取引先・状態・在庫数・売価（`src/features/stock-inquiry/components/ProductListTable.tsx:61-67`）。状態は「すべて」では在庫切れと在庫ありだけ（58 契約 H） | 行のクリックで行の下に詳細（在庫数・売価・原価・最終入庫日・最終販売日、58 §58.7）。詳細から「在庫変動履歴」（今の URL を `returnTo` で渡す、`src/features/stock-inquiry/components/StockDetailContent.tsx:40`、UI-06a-D7）、「商品修正」（`returnTo` なし、`StockDetailContent.tsx:97`。修正の後は商品一覧へ戻る、S-14）、「入庫記録」（商品の事前入力なし、`StockDetailContent.tsx:103`） | O-1、O-2、O-3、O-4 |
| S-04 | 在庫少一覧（サイドバーの項目、UI-06b、REQ-302） | 在庫少の常設の入口（58 §58.1、D-047。独立の画面を作らず S-03 への deep-link） | S-03 と同じ。サイドバーは `/stock?status=low_stock` を開く（`src/config/navigation.ts:206-214`）。在庫切れにはサイドバーの入口が無い（チップだけ） | 在庫少（`list_low_stock(false)` のうち在庫 > 0）の全件、ページなし。0 件なら「該当する商品がありません」と「商品コード・商品名・JANコードを変えてもう一度検索してください」と「絞り込みを解除」（`StockInquiryPage.tsx:212-224`。状態が既定でないので解除の button が出る `:79`） | S-03 と同じ | S-03 と同じ | O-2、O-3 |
| S-05 | 在庫変動履歴（`/stock/$code/movements`、UI-06c、REQ-303） | 1 商品の在庫がなぜ増減したかを時系列で追う（66 §66.1、SCREEN_DESIGN §3 入出庫履歴・在庫変動追跡） | 商品は path で 1 つに固定（UI-06c-D1）。期間（`dateFrom`・`dateTo`）、種別（すべて・入庫・返品・交換・POS売上・手動販売・廃棄・破損・棚卸し、`src/features/stock-movements/types.ts:8-16`）、表示件数 50・100・200（ローカル、UI-06c-D2）、ページ | その商品の全期間の変動（日付の既定なし、`types.ts:28-42`、`src/features/stock-movements/hooks/useStockMovements.ts:46-53`）と商品のサマリ | 日時・種別・増減・変動後在庫・元記録・備考（`src/features/stock-movements/components/MovementTable.tsx:62-67`） | 元記録 → 各記録の詳細（UI-06c-D6）。「在庫照会へ戻る」→ `returnTo` か `/stock?q=商品コード&selected=商品コード`（`src/features/stock-movements/StockMovementsPage.tsx:76`・`:101`、UI-06c-D9）。入口は S-03 の詳細と 6 つの記録の詳細（`src/features/inventory-records/*RecordDetailPage.tsx` の `/stock/$code/movements` の link） | O-8 |
| S-06 | 入出庫履歴（`/inventory/records`、UI-02b/05b、REQ-206〜208） | 過去の業務記録を探して確かめる（65 §65.8.1、SCREEN_DESIGN §3 入出庫履歴・在庫変動追跡） | 記録種別、期間、記録 ID、検索欄（live、商品コード・商品名・JAN、`src/features/inventory-records/InventoryRecordsPage.tsx:201`、BIZ は `src-tauri/src/db/disposal_repo.rs:461-475`）、部門、状態（すべて・有効・取消済み・進行中）、表示件数、ページ（`InventoryRecordsPage.tsx:87-97`）。並べ替えの道具は無い（既定は業務日付の降順、65 §65.4.2） | 全種別の記録の一覧 | 種別・業務日付・代表商品・状態・記録日時・操作（`InventoryRecordsPage.tsx:338-343`） | 各記録の詳細 | O-8 |
| S-07 | 入庫記録（`/inventory/receiving`、UI-02、REQ-201） | 仕入れた商品が届いたときに記録する（61、SCREEN_DESIGN §3 入庫記録画面） | 商品追加欄: Enter で `search_products`（廃番を除く・10 件、`src/features/receiving/ReceivingPage.tsx:59-66`・`:236-262`。1 件なら追加、複数なら候補、0 件なら商品登録への導線、UI-02-D4）。入力中の候補は 5 件と超過の footer（`src/components/patterns/useProductAddSuggest.ts:6-16`、catalog ⑮ SPEC-SUGGEST-D3）。部門・並べ替えは無い | 空の明細と最近の入庫 10 件 | 候補: 商品コード・商品名・部門・操作（`ReceivingPage.tsx:517-520`）。明細: 商品コード・商品名・単位・数量・原価・操作（`ReceivingPage.tsx:563-568`） | 0 件で「商品登録へ進む」→ `/products/new`（`ReceivingPage.tsx:505`）。「在庫照会へ戻る」→ `/stock` を引数なしで（`ReceivingPage.tsx:297`・`:366`）→ S-03 の案内。最近の記録 → 記録の詳細 | O-7 |
| S-08 | 返品・交換（`/inventory/return`、UI-03、REQ-202） | お客様の返品・交換を記録する（63、SCREEN_DESIGN §3 返品・交換画面） | S-07 と同じ形の商品追加欄（`src/features/return-exchange/ReturnExchangePage.tsx:75-82`、UI-03-D9） | 空の明細と最近の返品・交換 10 件 | 候補: 商品コード・商品名・部門・現在庫（`ReturnExchangePage.tsx:769-773`）。明細: 商品コード・商品名・部門・現在庫・方向・数量（`:818-824`） | 「在庫照会へ」→ `/stock` を引数なしで（`:424`・`:501`） | O-7 |
| S-09 | 手動販売出庫（`/inventory/manual-sale`、UI-04、REQ-203） | レジを通さず売った商品の在庫を減らす（62） | S-07 と同じ形（`src/features/manual-sale/ManualSalePage.tsx:72-79`、UI-04-D4） | 空の明細と最近の手動販売（`ManualSalePage.tsx:739-746`） | 候補: 商品コード・商品名・部門・現在庫・売価（`ManualSalePage.tsx:544-549`）。明細: 商品コード・商品名・部門・現在庫・数量・販売金額（`:596-602`） | 「在庫照会へ」→ `/stock` を引数なしで（`:318`・`:408`） | O-7 |
| S-10 | 廃棄・破損（`/inventory/disposal`、UI-05、REQ-204） | 傷んだ・破損した商品を在庫から除く（64） | S-07 と同じ形（`src/features/disposal/DisposalPage.tsx:72-79`、UI-05-D5） | 空の明細と最近の廃棄 | 候補: 商品コード・商品名・部門・現在庫・原価（`DisposalPage.tsx:453-458`）。明細: 商品コード・商品名・部門・現在庫・種別・数量・原価・理由（`:505-513`） | 「在庫照会へ」→ `/stock` を引数なしで（`:290`・`:353`） | O-7 |
| S-11 | 棚卸し（`/stocktake`、UI-10、REQ-205） | 実在庫を数えてシステム在庫と突き合わせる（73 §73.1、UI-10-D1〜D3、SCREEN_DESIGN §3 棚卸し画面） | 対象確認欄: 商品コード・JAN の完全一致（`find_stocktake_item`）、無ければ商品名で `search_products`（廃番を含む・10 件、`src/features/stocktake/StocktakePage.tsx:116-123`・`:490-520`）。入力中の候補も廃番を含む（`:467`、SPEC-SUGGEST-D8）。一覧: 部門・「未入力のみ表示」（URL の `counted_only=false` が未入力のみ、`:785-795`、`src/routes/stocktake/index.tsx:12-16`）・表示件数・ページ | 進行中が無ければ開始の案内と前回の棚卸し（`StocktakePage.tsx:373-391`）、進行中なら一覧（UI-10-D1）。今の build は書く操作（開始・数の保存・確定）を止めている（`StocktakePage.tsx:91`、73 §73.15、停止 ADR） | 一覧: 商品コード・商品名・部門・現在在庫・実際の数・差異・最終カウント（`:861-867`）。候補: 商品コード・商品名・部門（`:631-634`） | 結果の画面（確定の後）。D-118 の (b) が画面の形を変える案を持つ（73 冒頭、proposed・未実装） | O-7 |
| S-12 | PLU書出し（`/products/plu-export`、UI-08、REQ-402） | 商品マスタからレジに登録する PLU のデータを書き出す（67 §67.1、SCREEN_DESIGN §3 PLU書出し画面） | 書出しの方法（差分・全件、`src/features/plu-export/PluExportPage.tsx:697`）。検索・部門・ページは無い | レジの登録状況の件数と、未反映の商品の全件（`list_plu_dirty`、`PluExportPage.tsx:202`）。0 件なら「PLU書出しが必要な商品はありません。」（`:640-642`） | 商品コード・JANコード・商品名・売価・在庫（`:654-658`） | 行からの行き先は無い | O-5 |
| S-13 | 一括価格改定（`/products/price-revision`、UI-14、REQ-105・REQ-106） | 値上げのリストと商品を照らし、1 行ずつ売価・原価を確定する（77 §77.1、SPEC-PRV-D3〜D5） | 検索欄（商品コード・商品名・JAN・メーカー品番、`src/features/products/components/PriceRevisionFilters.tsx:52-55`）、取引先（と「取引先未設定の商品も含める」）、部門、「廃番を含む」、並べ替え（商品コード・商品名・在庫数・売価、昇順だけ、`src/features/products/priceRevisionSearch.ts:125-138`）、表示件数（既定 50、`:87-92`）、ページ。URL に持つ（`:20-35`） | 廃番以外の全商品の一覧 | 商品コード・JAN・メーカー品番・商品名・現売価・現原価・現掛率・新売価・新原価（案）・確定（`src/features/products/components/PriceRevisionTable.tsx:234-246`） | 行ごとにその場で確定。0 件（絞り込みなし）で「商品一覧を開く」（`src/features/products/PriceRevisionPage.tsx:120-127`） | O-6 |
| S-14 | 商品修正（`/products/$code/edit`、UI-01b、REQ-102） | 1 商品の項目を直す（51、SCREEN_DESIGN §3 商品登録・修正画面） | なし（1 商品） | その商品のフォーム。現在庫は表示だけで直せない（`src/features/products/components/ProductForm.tsx:412-422`） | なし | 保存・戻るで `/products` へ（`returnTo` は `/products` の URL だけを受ける、`src/features/products/lib/return-to.ts:7-27`、`src/routes/products/$code.edit.tsx:28-29`）。S-03 から来ても商品一覧へ戻る | O-4 |

### 外した画面と理由

- 売上データ取込み（`/csv-import`、`/csv-import/records/$importId`）: レジの資料を取り込む作業の画面で、商品を探す・在庫を見る道具を持たない。
- 日次売上・月次売上（`/reports/daily`・`/reports/monthly`）: 売上を見る画面。部門の絞り込み（`src/features/daily-sales/DailySalesPage.tsx:14`）はあるが、在庫を出さない（`rg -l 'stock_quantity|在庫' src/features/daily-sales src/features/monthly-sales` の出力が空）。
- 商品登録（`/products/new`）と一括インポート（`/products/import`）: 既存の商品を探さない新規の作成。
- 記録の詳細 7 つ（`/inventory/{receiving,return,manual-sale,disposal}/records/$recordId`・`/csv-import/records/$importId`・`/stocktake/records/$stocktakeId`）: 1 つの記録の中身を見る画面で探す道具を持たない。在庫変動履歴への行き先として S-05 に書いた。
- 整合性検証（`/settings/integrity`）: 在庫の写しと記録を突き合わせるシステム管理の画面で、商品を探す道具を持たない（検査の結果の一覧と補正だけ）。段 2 で必要なら入れる。
- 在庫少の基準（`/settings/thresholds`）: S-04 の判定の基準を設定する画面で、商品を出さない。
- バックアップ・復元・操作ログ・取引先管理（`/settings/*`）: 商品・在庫を扱わない。
- レシートの控え（UI-09c）: 未実装（proposed、D-121）。

### 正本と code の食い違い

裁定はしない（段 3 で、採った形に合わせて直す）。

| # | 正本 | code の現物 | 備考 |
|---|---|---|---|
| X-01 | 58 §58.4 の schema の例は `selected` の上限が 20 | `src/features/stock-inquiry/types.ts:37` は 100。66 UI-06c-D9 は 100 へ上げたと書く | 58 の例が古い |
| X-02 | 61 §61.5 と SCREEN_DESIGN §3 入庫記録画面: 複数の候補と明細に現在庫を出す | 入庫の候補（`ReceivingPage.tsx:517-520`）と明細（`:563-568`）に現在庫の列が無い（`grep -c 'stock_quantity\|currentStock\|現在庫' src/features/receiving/ReceivingPage.tsx` の出力 0）。他の 3 画面は出す（S-08〜S-10） | 画面の間で列が揃っていない |
| X-03 | 50 §50.2 UI-01a-D10〜D12（撤去）: 商品一覧は PLU の列・`plu` の絞り込み・PLU 対象の一括操作を持たない | 3 つとも残る（`ProductTable.tsx:48`、`search.ts:20-26`・`ProductListPage.tsx:143-151`、`ProductListPage.tsx:216-248`） | 撤去は後続の「PLU の書出しの見直しの runtime」（backlog の該当項目、D-117）。今の食い違いは決定済みの runtime 待ち |
| X-04 | 50 §50.6: 行のクリックで商品修正へ遷移する | 行にクリックの処理は無く、操作の列の「修正」の button が遷移する（`ProductTable.tsx:53-111`） | |
| X-05 | SCREEN_DESIGN §3 在庫照会画面: 検索欄は商品コード・商品名・JAN | 「すべて」は `search_products` で メーカー品番にも当たる（`product_repo.rs:853`）。在庫切れ・在庫少は画面の中の絞り込みで 商品コード・商品名・JAN だけ（`filter-low-stock-list.ts:41`）。同じ検索欄で、チップによって当たる列が変わる | |
| X-06 | SCREEN_DESIGN §3 PLU書出し画面: 0 件なら「差分はありません」 | 「PLU書出しが必要な商品はありません。」（`PluExportPage.tsx:640-642`） | 文言だけ |

未確認（段 2 の前に確かめる）: 65 §65.4.1 の「理由キーワード」と 65 §65.4.2 の sort の範囲は、入出庫履歴の画面（S-06）に道具が無い。BIZ の契約の一覧で画面が使わない項目なのか、画面の欠けなのかは 65 の他の節と突き合わせていない。→ 段 2 の run で確かめた（`## 段 2: 白紙の骨組み` の冒頭。画面の欠けではなく、65 の完成形の残り）。

### 重なる画面の組

解決案は書かない（段 2 の入力）。

- O-1: 商品検索・一覧（S-02）と在庫照会の「すべて」（S-03）。どちらも `search_products` を keyword・部門で呼び（`useProductList.ts` の `productsQuery`、`useStockInquiry.ts:55-73`）、在庫数・売価を出す。S-02 は原価・PLU・並べ替え・廃番の表示・URL の表示件数を持ち、S-03 は取引先・状態・詳細（最終入庫日・最終販売日）と在庫切れ・在庫少への切替を持つ。初めて開いたときは S-02 が一覧、S-03 が案内だけ（UI-01a-D1 と契約 I が逆に決めている。UI-01a-D1 は「在庫照会 UI-06a の検索駆動表示を機械的に横展開しない」と書く）。
- O-2: ホームの在庫切れ・在庫少の件数（S-01）と在庫照会の在庫切れ・在庫少（S-03・S-04）。同じ `list_low_stock(false)` を同じ規則（在庫 0 以下と在庫あり）で分けるが、関数が 2 つある（`count-stock-status.ts:14-18` と `filter-low-stock-list.ts:28-34`）。件数 card から一覧へは行けない（D-089）。
- O-3: サイドバーの「在庫少一覧」（S-04）と在庫照会の「在庫少」のチップ（S-03）。同じ route と同じ表示（D-047、UI-12-D1）。在庫切れには同じ形の入口が無い。
- O-4: 在庫照会の詳細（S-03。在庫数・売価・原価・最終入庫日・最終販売日）、商品修正（S-14。現在庫・売価・原価ほか）、在庫変動履歴の商品のサマリ（S-05）。1 商品の情報を 3 か所で出し、S-03 → S-14 → 保存の後は S-02 に着く。
- O-5: 商品一覧の PLU の列と「未反映」の絞り込み（S-02）、PLU書出しの未反映の一覧（S-12）、ホームの PLU 通知バー（S-01）。商品一覧の側は撤去が決まっている（X-03）。
- O-6: 一括価格改定（S-13）と商品検索・一覧（S-02）。どちらも全商品を keyword・部門・廃番で絞り、売価・原価を出し、ページを持つ。取引先の絞り込みは S-13 だけが持つ（在庫照会の在庫切れ・在庫少は取引先名で並べるが絞れない）。
- O-7: 入出庫 4 画面と棚卸しの商品を選ぶ欄（S-07〜S-11）。同じ `search_products` を件数 10（Enter）と 5（入力中）で呼ぶが、候補・明細の列が画面ごとに違う（X-02）。棚卸しだけ廃番を含み、完全一致を先に引く。
- O-8: 入出庫履歴（S-06。商品の語で記録を探す）と在庫変動履歴（S-05。1 商品の変動を追う）。どちらも「なぜ在庫が変わったか」に答える（SCREEN_DESIGN §3 入出庫履歴・在庫変動追跡）。在庫変動履歴には商品を選ぶ道具が無く、S-03 か記録の詳細からしか入れない。

### 初めて開いたときに何も出ない所

- E-01: 在庫照会（S-03）を状態「すべて」・検索語なしで開いたとき（部門だけを選んでも同じ）。一覧を取らず検索の案内だけ（契約 I）。この状態に着く入口: サイドバーの「在庫照会」（`navigation.ts:89-97`）、ホームの入口 card（`QuickActionGrid.tsx:13`）。
- E-02: 入出庫 4 画面の「在庫照会へ戻る / 在庫照会へ」（S-07〜S-10 の行の file:line）。引数なしの `/stock` へ行くので E-01 と同じ案内に着き、入れたばかりの商品も検索し直さないと見えない。
- E-03: 在庫少一覧・在庫切れ（S-04）が 0 件のとき。「該当する商品がありません」に、検索語を変えるよう促す文と「絞り込みを解除」が付く（検索語を入れていなくても出る。`StockInquiryPage.tsx:212-224`）。
- E-04: 棚卸し（S-11）に進行中が無いとき。一覧は無く、開始の案内と前回の要約だけ（UI-10-D1）。今の build は開始も止めている（73 §73.15）。
- E-05: PLU書出し（S-12）で未反映が 0 件のとき。文だけ（X-06）。
- 参考（何も出ないのではなく、入力の画面として空から始める）: 入出庫 4 画面の明細（S-07〜S-10）は空から始め、下に最近の記録を出す。

## 段 2・段 3 の進め方（後の run）

### 段 2: 白紙の骨組み

今の画面の形を前提にせず、店の仕事から「どの場面で、何を探し・見て・直すか」を組み、それに要る画面と要素を置く。

- 入力 1（店の仕事の流れ）: `docs/project-memory.md` の「Store Premises Facts」（「いまの手作業」「営業中の作業と中断」「決めた運用」「利用者」）と `docs/SCREEN_DESIGN.md` §2「利用者の1日の動線」、`docs/spec/requirements.md` の REQ-103・REQ-201〜205・REQ-301〜303・REQ-402・REQ-105。店の事実で足りないもの（発注を考えるときに在庫照会で最初に見たいもの、入庫の後に確かめたいもの、在庫少と在庫切れを見る頻度）は repo 外の回答台帳を先に引き、無ければ owner への問いの束にする（具体的な問いか短い選択で答えられる形。owner は数日手が使いにくいので選択肢で問う）。
- 入力 2（確立した UI の考え方）: design-system の正本が引く文献だけを使う（`docs/design-system/03-philosophy.md` の「出典の一覧」）。主に当てるもの: GOV.UK の *Start with user needs* と *Do less*（画面と道具を増やさない）、Shopify Polaris の情報アーキテクチャと「リソースページ + アクションページ」（探す画面と直す画面の分け方）、IBM Carbon の Progressive disclosure とデータテーブルの型、Nielsen のヒューリスティクス（#1 状態の見える化、#6 記憶より認識）、Laws of UX の Hick の法則・チャンク化、Microsoft Fluent 2 の *Coherent*（どの画面でも同じ場所に同じもの）、原田本の Q5（一覧の操作）・Q12（操作体系はシンプルに）・Q15（ページング）。原則は `docs/design-system/04-backbone.md` の 11 の原則（特に 3・5・6・7）、owner の受け取り方は 03 の「owner の受け取り方（L3 の原文から）」（「壊さない優先」「共通化は道具」「飾りより情報」「配置の常識」）。
- 出力: 場面ごとの「探す・見る・直す」の要素の表（場面 → 要る情報 → 要る道具 → 初めて開いたときに出すもの → 次に行く先）と、それを画面へまとめた骨組み（画面の数と各画面の役割）。各要素に根拠（文献の原則か店の事実の ID）を添える。今の画面の名前と route を使わずに書く。

### 段 3: 今の設計との突き合わせと owner の採否

- 段 2 の骨組みと段 1 の表を、画面ごと・要素ごとに突き合わせ、合う所・違う所・骨組みに無い今の要素を並べる。
- 段 1 の重なりの組（O-1〜O-8）と何も出ない所（E-01〜E-05）の全部に、選択肢（少なくとも「今のまま」「役割を分け直す」「統合する」の 3 つを検討し、成り立たない案は理由を添えて外す）を作る。各案に、使い手から見て変わること、失うもの、後続の runtime の大きさの見込み（触る画面・command・route の数。測っていなければ `未実測`）、並走の lane（D-118 の (b)、D-117 の runtime、棚卸しの b1・b2）との重なりを書く。推奨は confirmed / candidate / precondition-dependent を分けて添える。
- owner に、新しい案を今の画面と並べて見せる（03 の「壊さない優先」）。採否は repo 外の回答台帳に残し、packet と正本は ID で引く。
- 採った形を正本へ置き換え（Scope の段 3 の行）、D-138 を decision-log に置き、後続の runtime の項目を backlog に置き、Test Design Matrix を書いて plan-draft へ進む。

## 段 2: 白紙の骨組み

2026-10-24、起草役（段 2 の run）。今の画面の構成を前提にせず、店の仕事の場面（2.1）と design-system が引く原則（2.2）から要素を組み（2.3）、画面へまとめた（2.4・2.5）。段 1 の O・E・X との突き合わせと段 3 の入力は 2.6〜2.8。店の事実は repo 外の回答台帳の ID（L-・CB-・QU-・FC-・TD-）と `docs/project-memory.md` の行で引き、原文は書かない。行番号は HEAD `0f100fec`（code は起点 main `843c4938` と同じ。`git diff --stat 843c4938 HEAD` の出力は本 packet の 1 file だけ）。

段 1 の未確認の解消: 65 §65.4.1 の「理由キーワード」と §65.4.2 の sort の範囲は、65 の完成形の BIZ の契約で、§65.10 が段階に分けて実装する。画面の契約 §65.8.1 の上部の道具の列挙（日付範囲・種別・記録ID・商品検索・部門・状態）には入っていない。今の入出庫履歴（S-06）の道具は §65.8.1 と合い、画面の欠けではない（完成形の残り）。O-8 の中身は変わらない。

### 2.1 店の仕事の場面

根拠のある場面だけを置く。「いつ」が台帳に無いものは無いと書く。

| # | 場面 | 誰が・いつ | 手に持つもの | 知りたいこと・したいこと | 根拠 |
|---|---|---|---|---|---|
| B-01 | 発注の準備 | 店主。発注書を書くとき。用紙は週末と週明けで分けている。1 日のどの時点かは台帳に無い | 紙の発注書（1 枚に複数の取引先を、取引先別に書く） | 在庫が無い・少ない商品を取引先別に見る。発注書に書く番号（メーカー品番）。発注するかは在庫の無いものから決め、予算で絞る。今は発注書を持って棚を目で見て回る。在庫の画面に検索の条件を足す必要は無い（QU-004。店の原文でなく、agent の要約に店が合意した形。「足さない」で、今の道具を外す根拠ではない） | L-124、L-126、L-127、L-129・CB-009、QU-004、L-130、L-174、TD-362、REQ-302、`docs/evidence/hearing-2026-09-05-stock-inquiry.sanitized.md` |
| B-02 | 入荷の検品と入庫 | 店主。品物が届いたとき。営業中にも起こり、接客で中断される | 納品書（伝票）・発注書・品物 | 伝票と発注書の数を突き合わせる。入庫を記録する。原価がマスタと違えば知る。未登録の新商品は登録する。検品の後に値付けして品出しし、値段の控えを直す（値札はアプリの外）。伝票でいちばん見る番号はメーカー品番。取り寄せ（客注）の品は入庫に入れない。入れた後に在庫の画面で何を確かめたいかは台帳に無い（2.6 の Q-2） | L-131（FC-022〜FC-026）、REQ-201、REQ-209、`docs/project-memory.md`「営業中の作業と中断」、TD-362、TD-350 |
| B-03 | 商品を探す | 店主。営業中を含む | 商品名・現物・品番・色番・サイズ | どの商品か。商品名から入り、PC で検索してメーカーを調べ、カタログか仕入先に当たり、迷えば最後に JAN で決める。サイズ・規格・色番で探すこともよくある（色番・サイズが商品のどの項目に入るかは確かめていない）。取引先で絞ってから探す使い方も想像しやすい（owner 判断。商品検索への取引先の絞り込みの露出は backlog） | L-122・FC-078、L-193・FC-077、FC-076、L-202、`docs/project-memory.md`「いまの手作業」の Product lookup の行、REQ-103 |
| B-04 | 商品の項目を直す・登録する・廃番にする | 店主（owner も時々）。営業中にも、締めの後にも。接客で中断される | 探した 1 商品か、新しい商品 | 1 商品の項目を直す・登録する | REQ-101、REQ-102、`docs/project-memory.md`「いまの手作業」の締めの後の PC 作業の行、「営業中の作業と中断」、「利用者」 |
| B-05 | 値上げで売価・原価を直す | 店主。値上げの連絡が来たとき。長いリストを数日かけて、よく売れる物から | 印刷して書き込んだ値上げのリスト（バーコード・商品名・メーカー品番・旧売価・新売価が載る） | リストの行から店の商品を見つけ、売価・原価を 1 行ずつ直す。値札を付け替える（アプリの外） | `docs/project-memory.md`「いまの手作業」の Price-revision の 2 行と値上げの PDF の行、L-197、L-067、REQ-105 |
| B-06 | 在庫の増減の理由を追う | 店主。システムの在庫と棚の数のずれに気付いたとき（いつ起きるかは台帳に無い） | 1 つの商品 | その商品の在庫が、いつ・何の記録で増減したか。元の記録 | REQ-303、REQ-207、`docs/project-memory.md`「利用者」の在庫が実在庫と合うことを望む行 |
| B-07 | 年末の棚卸し | 店主。大晦日の時点、年 1 回（多くて 2 回）。準備は 10 月から。数える時間帯は決まっていない。途中で PC を閉じて後で続ける | 棚の順の一覧（今は owner が渡した Excel）、ノート PC | 数えていない商品はどれか、前年と比べる | `docs/project-memory.md`「いまの手作業」の棚卸しの行、L-066、REQ-205。画面の形は D-118 の (b) が持ち、本 lane は要素を決めない |
| B-08 | 売れた・戻った・傷んだ分を記録する | 店主。起きたとき（頻度は台帳に無い） | 品物、返品・交換ならレシート | 手動販売・返品交換・廃棄を記録する。期限切れ・破損は今は記録せず、棚卸しでロスにしている | REQ-202〜REQ-204、L-081 |
| B-09 | 記録を後から確かめる | 店主（いつかは台帳に無い） | 日付・商品・記録の種類 | 過去の入出庫の記録を探して中身を見る | REQ-206、REQ-208 |

根拠が足りず、骨組みの前提にしない場面:

- 開店の時点で在庫の画面を開いて発注を判断する: `docs/SCREEN_DESIGN.md` §2「利用者の1日の動線」は「開店 → 在庫照会（発注判断）」と書くが、設計の想定で、台帳の店の事実（L-124・L-126）は発注書を持って棚を回る形。PC で在庫を最初に何から見るかは Q-1 に回す。
- 客に在庫を聞かれて答える: 台帳に無い。扱っていない商品を客に聞かれたときはカタログで品番を確かめる（L-151・FC-017）が、アプリの外。
- レジで売る商品を反映する（PLU）: D-117 の runtime が画面を決める（本 lane の非目的）。

### 2.2 骨組みに当てる原則

design-system の正本（04 の 11 の原則、01 の DSR、02 のパターン）と、それが引く 03 の出典の一覧だけから引く。

| # | 原則（1 行） | 出所 | 骨組みでの使い方 |
|---|---|---|---|
| P-01 | 画面は使い手の場面から組む | GOV.UK *Start with user needs*（03 出典の一覧・③）、04 原則 5 | 2.1 の場面から要素を組み、今の画面の名前から始めない |
| P-02 | 画面と道具は「なければ業務が止まる」ものだけにする | GOV.UK *Do less*（03 ③） | 同じ一覧を 2 つ持たない。店が合意した要約で「足す必要は無い」とされた検索条件（QU-004）を足さない |
| P-03 | 探して見る画面（リソース）と、記録する画面（アクション）を分ける | Shopify Polaris「リソースページ + アクションページ」（03 ⑤） | 商品を探す・見る一覧と、入庫などの入力の画面を分ける。値上げの作業は入力を持つアクションの側 |
| P-04 | 同じものに同じ言葉を使う | Polaris の業務語彙の統一（03 ⑤）、04 原則 5 | 「在庫切れ」「在庫少」「取引先」を画面をまたいで同じ意味で使う |
| P-05 | 一覧は要る列だけ、詳細は開いて見る | IBM Carbon の Progressive disclosure（03 ④） | 一覧の列を場面ごとに絞り、最終入庫日などは行を開いて見る |
| P-06 | 業務データは密に、一度に全体を見せる | IBM Carbon のデータテーブル（03 ④）、japanese-webdesign の情報密度 = 信頼（03 観点借用）、04 原則 8 | 発注の準備は 1 つの一覧で全体を見る |
| P-07 | 開いた画面が、いま何を出しているかを見せる | Nielsen #1 状態の見える化（03 ②、ux-principles は 10 のヒューリスティクスを全て採る） | 初めて開いたときに何を出しているかを見せ、出していないなら何を出していないかと次の一手を必ず出す（一覧を出すこと自体の主な根拠は P-08 と TD-413） |
| P-08 | 覚えさせず、見て選ばせる | Nielsen #6 記憶より認識（03 ②） | 何を入れれば何が出るかを覚えていなくても、開けば商品が見える |
| P-09 | 選択肢を少なくする | Hick の法則（03 の Laws of UX、04 原則 3。04 原則 3 の元の意味は強調の段階で、目立つものを少なくして、いま押すもの・見るものを 1 つに決める。入口・画面の数への適用は伸ばし） | 入口・チップ・画面の数と、1 画面の道具の数を減らす |
| P-10 | 関係する情報を塊にまとめる | チャンク化（03 の Laws of UX、04 原則 5） | 発注の準備は取引先ごとの塊に並べる |
| P-11 | どの画面でも同じ所に同じものを置き、同じ操作は同じに動く | Fluent 2 *Coherent*（03 ⑦）、04 原則 6・7 | 検索欄が当たる列、商品を選ぶ欄の列、行を開く動きを全画面でそろえる |
| P-12 | 予測どおりに動き、驚かせない | Fluent 2 *Relevant*（03 ⑦） | 「在庫照会へ戻る」のような導線は、押す前に想像した先（いま扱った商品）へ着く |
| P-13 | 一覧の操作は 1 か所にまとめ、並べ順を明示する | 原田本 Q5（03、04 原則 6） | 検索・絞り込みは一覧の上の枠に、並べ順を見せる |
| P-14 | 操作体系はシンプルにする | 原田本 Q12（03、04 原則 6。Q12 §1 の元の意味は、初めて触る人には操作体系がシンプルなほうがインタラクションの手間が少ない。design-system はこれを pager の button を上下 2 組出さない規則に当てている〈04 原則 6、02 の該当の禁止〉。画面の経路の数への適用は伸ばし） | 同じ目的に 2 つの経路を作らない |
| P-15 | 長い一覧はページで分ける | 原田本 Q15（03、04 原則 6） | 全商品の一覧はページを持つ。短い作業の一覧（発注の準備）は件数しだい |
| P-16 | 空のときは「何が無いか」と「次の一手」を言う | DSR-11（01）、02 ⑥ の空状態の標準 UI | 0 件の文言は、選んでいる条件に合わせる（検索語を入れていないのに「検索語を変えて」と言わない） |
| P-17 | 戻る導線は来た所へ戻す | DSR-18（01） | 1 商品を直した後・増減を見た後は、来た一覧の条件へ戻す |
| P-18 | 詳細は選んだ行の直下に開き、スクロールの往復を減らす | 02 ⑫ 行インライン展開 | 1 商品の詳細は一覧の行の下に開く |
| P-19 | 保存の後は結果を見せ、作業の区切りを付ける | DSR-19（01、Peak-End の法則・Zeigarnik 効果） | 記録の保存の後に、入れた商品とその在庫を見せる |
| P-20 | 中断した作業の場所がすぐ分かる | 04 原則 10（Zeigarnik 効果） | 営業中の中断（B-02・B-04）から戻ったとき、一覧の条件と位置が残る |
| P-21 | 読める大きさと区別を最低線にし、実機で確かめる | 04 原則 1・2・11（WCAG、Laws of UX。原田本は高齢の利用者への直接の規定を持たない〈Q12 caution〉） | 列を増やす案は、16px のまま横に収まるかを後続の runtime の L3 で確かめる |
| P-22 | 新しい案は今の形と並べて見せ、実機を見てから決める | 03「owner の受け取り方」の「壊さない優先」「分からないときは…実機を見てから決める」 | 段 3 で、案を今の画面と並べて owner に見せる |
| P-23 | 共通にするのは道具で、画面の構造はその画面の意味を優先する | 03「owner の受け取り方」の「共通化は道具」 | 統合は「同じ問いに答える一覧」に限り、別の問いに答える画面（記録を探す・値上げの作業）はまとめない |
| P-24 | データに無い欄や、押せると誤解させる文を置かない | 03「owner の受け取り方」の「飾りより情報」 | 足す列はデータにあるもの（メーカー品番・取引先）に限る |
| P-25 | 在庫少の一覧は状態 → 在庫数 → 売価の順 | 03「owner の受け取り方」の「配置の常識」 | 発注の準備の一覧の列の順 |

「1 つの目的に 1 つの画面」は design-system に同じ名の原則が無く、P-02・P-03・P-14 と `docs/SCREEN_DESIGN.md` §4「在庫照会のREQ統合」の理由（別画面にすると、どっちの画面かと迷う）から導いた。限定: §4 の理由は在庫の中の統合（REQ-301 と REQ-302 を 1 画面に）の記録で、商品一覧と在庫照会の間への適用は類推である。今の正本の UI-01a-D1（`docs/function-design/50-ui-product-list.md:19`）は、商品一覧を商品管理の入口（既存の商品の把握と修正の対象探し）として在庫照会と別の目的に置き、在庫照会の初めの表示を写さないと明文化している。P-09・P-14 も上の表のとおり出所の元の意味からの伸ばしを含むので、この原則は段 3 で owner に「類推」と示して使う。

### 2.3 場面ごとの要素

今の画面の名前と route を使わずに書く。要素の名は 2.4 で使う。

| 場面 | 要る情報 | 要る道具 | 初めて開いたときに出すもの | 次に行く先 | 根拠 |
|---|---|---|---|---|---|
| B-01 発注の準備 | 在庫切れ・在庫少の商品、取引先、メーカー品番、状態（切れか少か）、在庫数、売価 | 並べ順（取引先順）。今の在庫切れ・在庫少の一覧が持つ検索語・部門の絞り込みより足さない（QU-004） | 在庫切れと在庫少を 1 つの一覧に、取引先ごとの塊で（ページを分けるかは件数しだいで `未実測`） | 1 商品の詳細 → 入庫する・増減を見る | QU-004、L-130、L-174、TD-362、P-02・P-06・P-10・P-25 |
| B-02 入荷の検品と入庫 | 伝票の商品・数量・原価、マスタの原価との差、保存の後の在庫 | 商品を選ぶ欄（商品名・商品コード・JAN・メーカー品番、スキャナの Enter） | 空の明細と最近の記録（入力の画面は空から始める） | 保存の後に、入れた商品とその在庫を見る所。未登録なら 1 商品の項目（登録） | L-131、REQ-209、TD-362、P-03・P-12・P-19 |
| B-03 商品を探す | 商品名・商品コード・JAN・メーカー品番・部門・取引先・在庫数・売価・原価 | 1 つの検索欄（4 つの列に当たる）、部門、取引先（露出は backlog）、廃番の表示、並べ替え | 商品の一覧（廃番以外） | 1 商品の詳細 → 直す・増減を見る・入庫する | L-122、L-193、L-202、P-07・P-08・P-11・P-15 |
| B-04 1 商品を直す | 1 商品の全項目 | 入力の form | その商品の今の値 | 保存・戻るで来た一覧の条件と位置へ | REQ-102、P-17・P-20 |
| B-05 値上げで売価・原価を直す | 旧と新の売価・原価、メーカー品番、JAN | 1 つの検索欄（B-03 と同じ列）、取引先、部門 | 作業の一覧（廃番以外） | 行ごとにその場で確定 | L-197、REQ-105、P-03・P-23 |
| B-06 増減の理由を追う | 1 商品の増減の時系列と元の記録 | 期間・種別 | その商品の全期間 | 元の記録、来た所へ戻る | REQ-303、REQ-207、P-17 |
| B-07 棚卸し | （D-118 の (b) が決める） | 同左 | 同左 | 同左 | 非目的 |
| B-08 売れた・戻った・傷んだ | 品物・数量・種別 | B-02 と同じ商品を選ぶ欄 | 空の明細と最近の記録 | 保存の後に、扱った商品とその在庫を見る所 | REQ-202〜REQ-204、P-11・P-19 |
| B-09 記録を後から確かめる | 記録の種別・日付・代表の商品・状態 | 期間・種別・記録ID・商品の語・部門・状態 | 全種別の記録の一覧 | 記録の詳細 | REQ-206、P-23 |

### 2.4 骨組みの案

要素の名: K-1 商品の一覧（探す）、K-2 1 商品の詳細（行の下に開く）、K-3 発注の準備の一覧、K-4 1 商品の項目、K-5 記録の入力（入庫・返品交換・手動販売・廃棄）、K-6 記録を探す、K-7 1 商品の増減、K-8 値上げの作業の一覧、K-9 棚卸し、K-10 入口（件数と各画面への入口）。

統合の形（案 A）と役割の分け直しの形（案 B）を置く。2 案で違うのは K-1・K-2・K-3 の置き方だけで、他の要素は 2.5 の共通の画面に置く。

#### 案 A: 商品と在庫を 1 つの画面にまとめる（統合）

| 画面 | 受け持つ場面 | 検索の道具 | 絞り込み | 初めて開いたときに出すもの | 一覧の列 | 行から行ける先 |
|---|---|---|---|---|---|---|
| 商品と在庫（K-1 + K-2 + K-3） | B-01、B-03、B-04・B-06 の入口 | 1 つの検索欄（商品名・商品コード・JAN・メーカー品番。どの状態を選んでも同じ列に当たる） | 状態（すべて / 在庫切れ・在庫少）、部門、廃番の表示、並べ替え、表示件数。全部 URL に持つ | 段 3 の決定 2 で選ぶ（全商品か、在庫切れ・在庫少か）。どちらでも一覧が出る | すべて: 商品コード・商品名（廃番の badge と JAN を同じ欄）・部門・取引先・状態・在庫数・売価・原価。在庫切れ・在庫少: 取引先・メーカー品番・商品コード・商品名・状態・在庫数・売価（取引先順） | 行の下に詳細（在庫数・売価・原価・最終入庫日・最終販売日）→「直す」（K-4）・「増減を見る」（K-7）・「入庫する」（K-5。その商品を明細に入れた状態で開く） |

- 状態は「在庫切れ・在庫少」を 1 つにまとめ、切れか少かは状態の列で見分ける（B-01 は両方を 1 枚で見る、QU-004。状態の列は L-248）。
- 入口: サイドバーとホームから「商品と在庫」を 1 つ。発注の準備の常設の入口を残すなら、同じ画面の「在庫切れ・在庫少」を開く項目にする（今の D-047 の deep-link と同じ形）。

#### 案 B: 探す画面と発注の準備の画面に分ける（役割の分け直し）

| 画面 | 受け持つ場面 | 検索の道具 | 絞り込み | 初めて開いたときに出すもの | 一覧の列 | 行から行ける先 |
|---|---|---|---|---|---|---|
| 商品（K-1 + K-2） | B-03、B-04・B-06 の入口、1 商品の在庫を見る（REQ-301） | 1 つの検索欄（4 つの列） | 部門、廃番の表示、並べ替え、表示件数。URL に持つ | 全商品の一覧（廃番以外、商品コード順） | 商品コード・商品名（廃番の badge と JAN）・部門・取引先・状態・在庫数・売価・原価 | 行の下に詳細（案 A と同じ）→ 直す・増減を見る・入庫する |
| 発注の準備（K-3 + K-2） | B-01（REQ-302） | 1 つの検索欄（4 つの列。今の在庫切れ・在庫少の一覧の検索語の絞り込みを引き継ぐ） | 部門（今の一覧の部門の絞り込みを引き継ぐ）。これより足さない | 在庫切れと在庫少の全件を、取引先ごとの塊で | 取引先・メーカー品番・商品コード・商品名・状態・在庫数・売価 | 行の下に詳細（同じ部品）→ 入庫する・増減を見る・直す |

- 在庫の画面から「全商品を見る」形が無くなり、1 商品の在庫は「商品」で探す。サイドバーの在庫の入口は「発注の準備」の 1 つになる。
- 発注の準備に検索語と部門の絞り込みを残す理由: 今の在庫切れ・在庫少の一覧はこの 2 つで絞れる（`src/features/stock-inquiry/lib/filter-low-stock-list.ts` の `filterAndSortLowStockList(rows, q, dept, status)`）。QU-004 は「足す必要は無い」で、今の道具を外す根拠にならない（しかも agent の要約に店が合意した形で、店の原文でない）。外すと、取引先の塊の中から 1 商品や 1 部門を探す手段が無くなり、店主に「商品の画面へ移って探し直す」往復を残す（AGENTS.md「使い手に押しつけない」、03「壊さない優先」〈P-22〉）。足さないことは P-02 で守る。
- 取引先の塊を注文先（問屋）で作るか、今のメーカー/ブランドのまま作るかは、注文先の軸の設計（TD-193、`docs/backlog.md` の取引先の意味の項目、`docs/project-memory.md` の注文先の訂正の行）しだい。それまではメーカー/ブランドで並ぶ（L-130 の今の形）。案 A の「在庫切れ・在庫少」も同じ。

### 2.5 どの案にも共通に置く要素と画面

| 画面・要素 | 受け持つ場面 | 中身 | 解く段 1 の項目 | 根拠 |
|---|---|---|---|---|
| 1 商品の項目（K-4） | B-04 | 保存・戻るで、来た一覧（案 A の商品と在庫、案 B の商品・発注の準備）の条件と位置へ戻る | O-4 の戻り先、S-14 の `returnTo` が商品一覧だけを受ける点 | P-17・P-20 |
| 記録の入力（K-5、4 画面） | B-02、B-08 | 商品を選ぶ欄の候補と明細の先頭の列を「商品コード・商品名・部門・現在庫」にそろえ、画面ごとの列はその後ろに置く。保存の後の扱いは Q-2 の答え待ち: a・c なら「在庫を見る」は扱った商品だけを出した一覧へ行く（引数なしの一覧へ行かない）、b なら保存の結果の囲みに在庫を出すだけにし、在庫の画面への導線は目立たせない（どちらでも引数なしの一覧へは行かない） | O-7、X-02、E-02 | P-11・P-12・P-19、`docs/SCREEN_DESIGN.md` §3 入庫記録画面の明細に現在庫 |
| 検索欄の当たる列 | B-01・B-03・B-05 | 商品を探す欄は、どの画面・どの状態でも「商品名・商品コード・JAN・メーカー品番」に当たる | X-05 | P-11、L-174・TD-362（発注と伝票はメーカー品番） |
| 0 件の文言 | B-01・B-03 | 選んでいる条件に合わせて「何が無いか・次の一手」を言う（検索語を入れていないのに検索語を変えるよう促さない）。PLU の書出しの 0 件の文言は正本か code の片方にそろえる | E-03、E-05・X-06 | P-16 |
| 1 商品の増減（K-7） | B-06 | 今の要素のまま。入口は 1 商品の詳細（K-2）と記録の詳細。戻るは来た所へ | O-8 の「商品を選ぶ道具が無い」は、K-1 から K-2 を経て入れるので足さない | P-02・P-17 |
| 記録を探す（K-6） | B-09 | 今の要素のまま（65 §65.8.1） | O-8 は残す（記録を探す問いと、1 商品の増減の問いは別。P-23） | P-03・P-23 |
| 値上げの作業の一覧（K-8） | B-05 | 今の要素のまま。検索欄の当たる列だけ上の共通にそろえる | O-6 は残す（行ごとの確定と新しい売価・原価の入力を持つアクションの画面。P-03・P-23） | P-03・P-23 |
| 入口（K-10） | 件数と入口 | 件数の card は今のまま（D-089）。入口 card は案 A なら商品と在庫、案 B なら商品と発注の準備 | O-2 は残す（件数の数え方の関数が 2 つある点は使い手に見えない code の重複で、後続の runtime で 1 つにする候補） | P-09 |
| 棚卸し（K-9） | B-07 | D-118 の (b) が決める | E-04 は本 lane の外 | 非目的 |
| PLU | （場面から外した） | D-117 の runtime が商品一覧の PLU の列・絞り込み・一括の操作を外す | O-5・X-03 は D-117 の runtime で解く | 非目的 |

### 2.6 案ごとの突き合わせと、店の方の操作の変化

操作の数は設計からの数えで、測っていない（`未実測`）。

| 案 | 解く O・E・X | 残るもの | 初めて開いたときに見えるもの | 往復（今との比べ、`未実測`） |
|---|---|---|---|---|
| 今（比べる元） | — | O-1〜O-8、E-01〜E-05、X-01〜X-06 | 在庫の画面は案内だけ（E-01）。商品一覧は一覧 | 在庫の一覧を見るのに、検索語を入れるか状態を選ぶ操作が 1 つ要る。発注の準備は在庫少と在庫切れを状態のチップで切り替えて 2 つの一覧を見る。入庫の後の「在庫照会へ戻る」は案内に着き、商品を入れ直す。在庫照会から商品を直すと保存の後は商品一覧に着き、在庫照会へは画面を移って探し直す |
| A（統合） | O-1、O-3（在庫切れにも同じ入口が付く）、E-01、X-04（行は詳細を開き、直すは詳細から。50 §50.6 を置き換える）＋ 2.5 の共通（O-4、O-7、E-02、E-03、E-05、X-01〈58 を書き直すとき〉、X-02、X-05、X-06） | O-2・O-6・O-8（2.5 の理由で残す）、O-5・X-03（D-117）、E-04（D-118） | 一覧（全商品か在庫切れ・在庫少かは決定 2） | 開けば一覧が出る（追加の操作 0）。発注の準備は状態を 1 つ選ぶか、常設の入口から開く（切れと少は同じ一覧）。入庫の後は扱った商品が出る（Q-2 しだい、2.5 の K-5）。直した後は来た一覧の条件へ戻る。商品を直すのは 1 click から 2 click に増える（今は商品一覧の行の「修正」、`src/features/products/components/ProductTable.tsx:103-111`。案 A は行を開く → 詳細の「直す」）。1 画面の道具が 6 つ（検索欄・状態・部門・廃番の表示・並べ替え・表示件数）、「すべて」の列が 8 つになる（上の案 A の表の数え） |
| B（分け直し） | O-1（在庫の画面から全商品を外す）、O-3（入口が 1 つ）、E-01（「すべて」が無い）、X-04 ＋ 2.5 の共通 | A と同じ | 商品は全商品の一覧。発注の準備は在庫切れ・在庫少の全件 | 開けば一覧が出る（追加の操作 0）。発注の準備は常設の入口から開くだけ。1 商品の在庫を見るのは商品の画面で探す（在庫の画面からは探さない）。入庫の後と直した後は A と同じ。商品の画面も行を開いて直すので、直すのは A と同じく 2 click |

失うもの:

- 案 A: 商品管理の入口としての独立の画面（サイドバーの区分〈今は商品管理と毎日の業務に分かれる〉のどこに置くかを決め直す）。状態のチップが 3 つから 2 つになり、在庫切れだけ・在庫少だけの一覧は状態の列で見分ける。今の 2 つの URL の bookmark（旧い route を新しい画面へ寄せる手当てが要る）。商品を直す 1 click（商品一覧の行の「修正」、`ProductTable.tsx:103-111`）が 2 click（行を開く → 直す）になる。在庫だけを見たい人にも商品管理の道具（廃番の表示・並べ替え・原価の列）が見え、1 画面の道具が 6 つ・列が 8 つに増える。これは 03 の GOV.UK ③（*Do less*、典型の適用に「フィルタの組合せ」）と P-09 が案 A に逆向きに当たる所で、統合で画面の数を減らす利点と引き換えになる。
- 案 B: 在庫の画面で全商品を眺める形。商品を直す 1 click（A と同じく 2 click になる）。商品の画面は道具 5 つ（検索欄・部門・廃番の表示・並べ替え・表示件数）・列 8 つで、1 商品の在庫を見る人に商品管理の道具が見える点は A と同じ。REQ-301 を受け持つ画面が変わり、`docs/spec/requirements.md` の対応タスクの列と traceability が変わる。発注の準備は今の検索語・部門の絞り込みを残すので、それは失わない（2.4 案 B の注記）。

### 2.7 owner への問いの候補（本 run では問わない）

台帳に無く、決定 1・決定 2 の推奨を変える店の事実。owner は数日手が使いにくいので選択で答えられる形にする。段 3 の採否と同じ問い合わせに束ねられる（束ねるかと介入の数え方は Coordinator が決める）。

- Q-1（店主へ、決定 1・決定 2 を変える）: 「PC で在庫を見るとき、最初に何が出ていると助かりますか」— a 全部の商品の一覧（上から眺める）／ b 在庫切れ・在庫少の商品だけ（取引先別）／ c 何も出さず、名前や番号で探す（今の形）／ d どれでもよい。前提として伝える: 今は発注書を持って棚を回って確かめている（L-124）、欲しいのは取引先別の在庫切れ・在庫少の一覧と伺った（QU-004）。答えで変わる所: a なら決定 2 は a、b なら決定 2 は b で案 B の推奨が上がる、c なら決定 2 は c（契約 I を残し、E-01 には説明の手当てだけをする）、d なら推奨は動かず、決定 1 は A・決定 2 は a のまま（candidate。台帳の QU-004 と 2.2 の原則だけで決める）。Ordinary Operation の行が挙げた「部門で見る」は選択肢に入れない（台帳に根拠が無い。a・b のどちらでも開いた後に部門で絞れる）。
- Q-2（店主へ、2.5 の E-02 の着地を変える）: 「入庫を入れた後、すぐにその商品の在庫の数を確かめますか」— a 確かめる ／ b 確かめない（次の入庫か品出しへ）／ c 時々。答えで変わる所: a・c なら保存の後の「在庫を見る」は扱った商品を出した一覧へ。b なら保存の結果の囲みに在庫を出すだけにし、在庫の画面への導線は目立たせない。

注文先の軸（発注の準備の塊を問屋で作るか）は新しい問いにしない。owner は機能を入れると決めている（TD-193）が、設計は `docs/backlog.md` の取引先の意味の項目の lane が持つ。本 lane はそれを前提条件として扱う（2.4 案 B の注記）。

### 2.8 段 3 の入力の整理

#### 案ごとの置き換える正本と、後続の runtime の大きさの見込み

段 3 の「今のまま」を含む選択肢のために、骨組みの案ではない比べる案 C・D も置く。C は今の 2 画面の割り当てを残し、何も出ない所と戻り先だけを直す形（03 の「壊さない優先」に近い形）、D は何も変えない形。C は「E-01 だけ直して O-1 の裁定を先送りする」案で、「O-1 を今のままと裁定する」案ではない（O-1 を今のままと裁定するなら、UI-01a-D1 の「別の目的」を残す理由を D-138 に書く）。C が素直になる条件: Q-1 の答えが c（何も出さず探す）のとき、取引先の軸（TD-193）と D-117 の runtime が未解決で統合の画面の列・絞り込みが決まらないとき、並走の棚卸しの b1・b2 が棚卸しの画面を触っている間（A・B は在庫の画面と商品を選ぶ欄の共通の規則を広く触り、下の「大きさの見込みに足すもの」のとおり棚卸しの候補の列に当たり得る）。

後続の runtime の大きさは全部 `未実測` の見込み。数えた根拠: `rg -n 'to[=:] ?"/stock"' src --glob '!*.test.*' | wc -l` の出力 11（記録の 4 画面の 8 行、サイドバー 2 行、在庫変動履歴 1 行）。`find src/features/stock-inquiry -name '*.test.ts*' | wc -l` の出力 11、`find src/features/products -name '*.test.ts*' | wc -l` の出力 24（どれだけ書き換えるかは数えていない）。

| 案 | 置き換える正本の契約（Contract Ledger の行と追加） | 触る画面 | route | command | 備考 |
|---|---|---|---|---|---|
| A | 58 契約 I（§58.10、§58.1 失敗 4 状態の 4）、58 §58.10「廃番除外」（統合の画面に廃番の表示を置くため）、UI-01a-D1（50 §50.2。「機械的に横展開しない」の文は要らなくなる）、50 §50.6（X-04）、D-047・UI-12-D1（deep-link の先）、UI-06a-D1・UI-06a-D6（ページと件数を一覧の器へ）、UI-06a-D7・UI-06c-D9（戻り先）、UI-02-D4 系と SPEC-SUGGEST の列、`docs/SCREEN_DESIGN.md` §1（#4・#7）・§2（エリアと遷移）・§3（在庫照会・商品検索・一覧）・§4「在庫照会のREQ統合」（REQ-103 も入れた統合の記録へ）、02 ⑨・⑫ の canonical の記述 | 見込み 10 前後（商品一覧と在庫照会を 1 つに、サイドバー、ホームの入口 card、記録の 4 画面の戻り、在庫変動履歴の戻り、商品修正の戻り） | 一覧の route 2 → 1（旧い route は新しい画面へ寄せる）。子 route 6 つの置き場も決め直す（下の「足すもの」。2 → 1 は一覧の route だけの数で、触る route は実態より多い） | 新設 0 の見込み（`search_products` と `list_low_stock` を使い続ける） | route の統合と search params の互換は R3。段 3 の後に Boundary / Wire Contract を埋める |
| B | 58 契約 I（「すべて」ごと外すので条項を置き換える）、58 §58.1 の主動線（発注の準備へ）、UI-01a-D1（残し、後半の文を削る）、50 §50.6 と行の詳細の追加（02 ⑫）、D-047・UI-12-D1（サイドバーの入口を 1 つに）、UI-06a-D1・UI-06a-D6（「すべて」とともに消える）、UI-06a-D7・UI-06c-D9、UI-02-D4 系の列、`docs/SCREEN_DESIGN.md` §1・§2・§3・§4（REQ-301 は商品の画面、REQ-302 は発注の準備）、`docs/spec/requirements.md` の REQ-301 の対応タスク | 見込み 10 前後（A と同じ範囲。商品一覧に行の詳細を足し、在庫照会を発注の準備に変える） | 新設 0・既存の `/stock` の意味を変える（`status` の値と bookmark の互換） | 新設 0 の見込み。注文先の軸を入れるなら DB と command を足す（別 lane） | REQ の対応が変わるので traceability の再生成が要る |
| C | 58 契約 I、UI-01a-D1 の後半の文、UI-06a-D7・UI-06c-D9（記録の画面の戻り先）、58 §58.8 の 0 件の文言、UI-02-D4 系の列 | 見込み 7 前後（在庫照会、記録の 4 画面、商品修正の戻り、在庫少の 0 件） | 0 | 0 | O-1・O-3・X-04 は残る |
| D | なし（E-01・E-02 に説明の手当てを足すかは別に選ぶ） | 0 | 0 | 0 | O・E・X が全部残る |

大きさの見込みに足すもの（全部 `未実測`。上の表の「触る画面」の数に入っていない）:

- 一括価格改定の 0 件の導線「商品一覧を開く」（`src/features/products/PriceRevisionPage.tsx:120-127`、`to="/products"`）: A は行き先を統合の画面へ直す。B・C は `/products` を残すなら触らない。
- 子 route の移設（A。B は `/stock` の意味を変えるので `/stock/$code/movements` の戻り先だけ）: `/stock/$code/movements` と、`/products/new`・`/products/$code/edit`・`/products/plu-export`・`/products/price-revision`・`/products/import`。`find src/routes/products src/routes/stock -name '*.tsx' -not -name '*.test.tsx' | wc -l` の出力 8（一覧の route 2 と子 route 6）。残す親の path の下へ移すなら、各 route への link・`returnTo` の受け口（`src/features/products/lib/return-to.ts`）・到達の test も触る。
- 棚卸しの候補の列（S-11、`src/features/stocktake/StocktakePage.tsx:631-634` の 商品コード・商品名・部門）: 2.5 の K-5 の列そろえを 02 ⑮ の SPEC-SUGGEST の共通の規則として書くと棚卸しの候補にも当たり（02 ⑮ SPEC-SUGGEST-D13 は棚卸しを同じ部品の利用者に数える）、並走の b1・b2 と同じ画面を触る。A・B・C のどれでも起きる。避けるなら、そろえる対象を記録の入力の 4 画面に限ると 02 ⑮ に書く。
- traceability の再生成（A でも起き得る）: A は §4「在庫照会のREQ統合」に REQ-103 を入れ、`docs/spec/requirements.md` の REQ-103・REQ-301 の対応タスクの列が変わるなら `cargo run --bin generate_traceability` が要る（B は確実に要る）。
- 58 §58.10「廃番除外」との衝突（A）: 在庫照会は `include_discontinued = false` 固定で UI のトグルを持たない契約。統合の画面に廃番の表示を置く A は、この条項も置き換える（上の A の行の契約に足す）。B・C は在庫の一覧に廃番の表示を足さないので衝突しない。
- D-117 の runtime との順（A）: 商品一覧の PLU の列・`plu` の絞り込み・一括の操作の撤去（X-03）は D-117 の runtime の受け持ち。A の runtime が先に走ると、統合の画面に PLU の列と絞り込みを一旦載せるか、D-117 の撤去を先に入れる順にするかを決める（本 lane は D-117 の runtime の中身を決めない、非目的）。B・C は今の商品一覧に残る PLU の列が D-117 まで残るだけで、今と同じ。

#### owner の採否の選択肢の下書き

決定は 2 つ（Owner Effort Budget の段 3 の 2 回と同じ）。2.5 の共通の要素は、どの案でも入れるものとして決定 1 の説明に含め、別の決定にしない。

- 決定 1: 商品と在庫の画面の割り当て — A 統合 ／ B 分け直し ／ C 今の 2 画面のまま何も出ない所と戻り先だけ直す ／ D 今のまま。
  - 推奨 A（candidate）。理由: 2 つの一覧が同じ `search_products` を呼び、検索語・部門・廃番の除外・商品コード順の並びは既定では同じ（O-1。S-02 だけが廃番の表示・PLU・並べ替え・URL の表示件数を持ち、表示件数の既定も 100 と 50 で違う。`src/features/stock-inquiry/hooks/useStockInquiry.ts:55-73`、`src/features/products/hooks/useProductList.ts:44`）。同じ問いに答える一覧を 2 つ持つ理由が段 1 の事実に無い（P-02・P-14）。`docs/SCREEN_DESIGN.md` §4 が在庫照会の統合に挙げた理由（どっちの画面かと迷う）を、商品一覧と在庫照会の間にも類推で当てる（2.2 の限定。今の UI-01a-D1 は 2 画面を別の目的に置いている）。今の在庫照会の状態のチップと行の下の詳細を残すので、店主が見たことのある形を大きく変えない（P-22）。引き換え: 直すのが 2 click になり、1 画面の道具が 6 つに増える（2.6 の失うもの。GOV.UK ③・P-09 が逆向きに当たる）。
  - B は precondition-dependent: Q-1 の答えが b（在庫切れ・在庫少だけが助かる）で、注文先の軸の設計が見えてから推奨が上がる。
  - C は candidate の控え: owner が「壊さない優先」を強く取るなら、E-01・E-02 を最小の差で解く。C は O-1 の裁定を先送りする案で、O-1 を今のままと裁定する案ではない。素直になる条件は 2.8 の冒頭（Q-1 が c、取引先の軸・D-117 が未解決、並走の b1・b2 が棚卸しの画面を触っている間）。
  - D は推奨しない: E-01 が owner の所感（TD-413）の起点で、そのまま残る。
  - 答えで変わる所: 段 3 で置き換える正本の範囲（上の表の行）、D-047 の扱い、REQ の対応（B のときだけ）、後続の runtime の大きさ。
- 決定 2: 在庫を見る一覧を初めて開いたときに出すもの（A なら商品と在庫、C なら在庫照会。B は画面ごとに固定なので問わない。D は今の契約 I のまま） — a 全商品の一覧（廃番以外、商品コード順、ページあり）／ b 在庫切れ・在庫少（取引先順）／ c 案内だけ（今の契約 I）。
  - 推奨 a（candidate）。理由: 何を入れれば何が出るかを覚えていなくても、開けば商品が見える（P-08、E-01 が owner の所感 TD-413 の起点）。商品一覧が既に同じ形（UI-01a-D1）で、同じ一覧が同じに開く（P-11）。P-07 は a・b・c のどれでも「何を出しているか（出していないなら何を出していないかと次の一手）」を見せる条件で、a を選ぶ根拠には使わない。Q-1 の答えが b なら b に変える（precondition-dependent）。
  - c を選ぶなら、E-01 に「何を出していないか・次に何をするか」の説明を足す（P-16。今の案内の文は何を入れるかだけを言う）。
  - 答えで変わる所: 契約 I の置換えの文、読込みの失敗・0 件・範囲外の page・商品が 1 件も無い DB の場合の点検（Design Readiness の「絶対保証の例外」）、後続の runtime の test の行。
- confirmed（どの案でも同じで、根拠が design-system の既存の規則と台帳にあるもの）: 2.5 の共通の要素（戻り先〈DSR-18〉、商品を選ぶ欄の列〈Coherent〉、検索欄の当たる列〈Coherent・TD-362〉、0 件の文言〈DSR-11〉）。

段 1 の項目と決定の対応（段 3 で各項目の選択肢を作るときの入口）:

| 段 1 の項目 | 扱う所 |
|---|---|
| O-1・O-3・E-01・X-04 | 決定 1（E-01 は決定 2 も） |
| O-4・O-7・E-02・E-03・E-05・X-02・X-05・X-06 | 2.5 の共通（決定 1 の説明に含める。E-02 の着地は Q-2） |
| O-2・O-6・O-8 | 2.5 で「残す」と理由を書いた。段 3 で今のまま／変える案を owner に並べる |
| O-5・X-03 | D-117 の runtime（本 lane は変えない） |
| E-04 | D-118 の (b)（本 lane は変えない） |
| X-01 | 58 を置き換えるときに同じ PR で直す（案 A・B・C） |

## Contract Ledger

本 run は正本を変えない。段 3 の採否で置き換える見込みの契約を挙げる（採った形が決まった後に、実装の列と自動 test の列を埋め、触らない行は除外の理由を書く）。

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| 58 契約 I（「すべて」の検索駆動表示） | 58 §58.10、§58.1 失敗 4 状態の 4 | 段 3 の採否で決める（docs だけ） | 後続の runtime（今は `src/features/stock-inquiry/hooks/useStockInquiry.test.tsx` の status=all+q 空で enabled=false） | 後続の runtime の L3 |
| UI-01a-D1（商品一覧の初期表示） | 50 §50.2 | 段 3 の採否で決める | 後続の runtime | 後続の runtime の L3 |
| D-047・UI-12-D1（在庫少一覧を在庫照会の deep-link にする） | 58 §58.1、52 UI-12-D1 | 段 3 の採否で決める | 後続の runtime | 後続の runtime の L3 |
| UI-06a-D1・UI-06a-D6（在庫照会のページと件数） | 58 §58.10 | 段 3 の採否で決める | 後続の runtime | 後続の runtime の L3 |
| UI-06a-D7・UI-06c-D9（在庫照会への戻り先） | 58 §58.10、66 §66.2 | 段 3 の採否で決める（入出庫 4 画面の「在庫照会へ戻る」を含む） | 後続の runtime | 後続の runtime の L3 |
| D-089（ホームの件数 card は導線でない） | decision-log D-089、53 §53.1 | 段 3 の採否で決める | 後続の runtime | 後続の runtime の L3 |
| UI-02-D4 系と SPEC-SUGGEST-D3・D7（商品を選ぶ欄の候補） | 61〜64 の product add の行、73 UI-10-D2・UI-10-D12、02 ⑮ | 段 3 の採否で決める（候補・明細の列を揃えるか） | 後続の runtime | 後続の runtime の L3 |
| SCREEN_DESIGN §4「在庫照会のREQ統合」 | `docs/SCREEN_DESIGN.md` §4 | 段 3 の採否で決める | 非対象（文書の判断の記録） | 非対象 |

## Contract Probe

N/A: 段 1 の事実は repo の code と正本の現物だけから取り、外部の library・OS・機器の振舞いを前提にしていない。段 2 で要る店の事実は Contract Probe でなく、repo 外の回答台帳か owner への問い合わせで確かめる（AGENTS.md の Decision and Approval Boundaries）。

## Data Safety

- owner の所感の原文は公開 repo に書かない（repo 外の回答台帳 TD-413・TD-415 の ID で引く）。
- 店の商品名・JAN・金額・商品数・部門の中身を書かない。段 2 で店の事実を使うときも台帳の ID と要約の型（「発注は在庫少から見る」のような、店を特定しない形）にする。
- 例示の値は合成のもの（`HZ-0047` のような既存の正本の例）だけを使う。

## Implementation Results

段 3 の置換えの後に書く。

## Review Response

Plan Review の後に書く。
