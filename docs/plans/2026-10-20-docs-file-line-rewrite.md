# Plan Packet: 設計の正本・code の comment・backlog の file:行 の引用を symbol・節 ID・時点の commit で引き直す（docs の棚卸し lane 2a）

wave に属さない単独の lane（docs 全体の棚卸し〈owner 2026-10-18、計画は repo 外の回答台帳 TD-327〉の lane 2 の前半。owner の決定〈repo 外の回答台帳 TD-353、2026-10-20〉で lane 2 を 2 つに分けた: 2a = 既存の引用の書き換え〈本 lane、R2〉、2b = 違反 0 の状態から検査を足す〈`scripts/doc-consistency-check.sh` を変える R3 の別 lane、2a の merge の後〉）。docs と code の comment だけ。code の振舞い・migration・bindings・画面は変えない。

出所: 書き換えの規則は D-125 と [DOC_STYLE_GUIDE](../DOC_STYLE_GUIDE.md) §1「code と文書の箇所の引き方（行番号で引かない）」（規則の lane、PR #179）。D-125 の Guarantee range が「既存の引用の書き換えと検査は lane 2 が持つ」とする。起点 `18db621e` の read-only の調査（repo 外の報告。live な引用 505〈正本 221・backlog 121・code の comment 14・時点の記録 149〉、抜き取り 150 のずれ率 45%〈正本 29%・backlog 56%・comment 73%〉。調査の手の分類で command の出力ではない）の後に #179〜#182 で docs が動いたので、AC の baseline は本 packet の起票で今の base（`6a25f63f`）を command で数え直した出力（下の Acceptance Criteria、D-062）。

規模と手法: 書き換える対象は正本 72 行・code の comment 14 行・backlog 31 行（下の数え直し）。1 lane のまま、作業を S1〜S5 に分け、段ごとに AC を置く。本 run（起票）は packet と `docs/Plans.md` の pointer の 1 句だけを置き、引用の書き換えは plan-approved の後の別の run で行う。

## Workflow State

- Phase: plan-draft
- Risk: R2
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は本 run。書き換えは plan-approved の後の別の run）
- Plan Reviewer: fresh Opus 5.5（fork でない）+ Codex。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Reviewer: fresh Opus 5.5（Claude 側。R2 で design lane でないので座組表の「それ以外」の行）+ Codex。座組表どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/docs-file-line-rewrite

manual なし: 製品の runtime・画面・配布物を変えない docs と comment の変更で、Windows native で確かめる物が無い。

遷移の記録:

1. kickoff → spec-check（2026-10-20、起草役）: 範囲を D-125 の Guarantee range のうち「既存の引用の書き換え」（TD-353 の 2a）にし、Risk を R2 と記録した（下の Risk）。
2. spec-check → plan-draft（2026-10-20、起草役、同じ commit）: 表の唯一の skip。規則は D-125 と DOC_STYLE_GUIDE §1 に在り、本 lane は規則を変えずに既存の引用へ当てるだけなので、design の段で足す設計の出力が無い（下の Design Readiness）。
3. plan-draft（round 1 の是正）: Plan Review round 1 の是正（Review Response 参照）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 1（起票の時点。TD-353〈lane 2 を 2a と 2b に分ける、2026-10-20〉1） | 1（Ready・merge の指示） | 4 | 6 = 1 + 1 + 4 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R2

Reason:
docs と code の comment だけの変更で、runtime の契約を変えない。直すのは引用の書き方（行番号 → path と symbol・節 ID、backlog は時点の commit）で、引用が支える文の中身・command・DTO・DB・画面の振舞い・merge gate を変えない。`docs/DEV_WORKFLOW.md` Risk Tiers の境の規則（安定した契約・出力 schema・data safety の境・command の形・route・workflow gate に触れるなら R3）には当たらない。`scripts/ci/classify-changes.sh` の workflow の一覧に当たる file のうち引用を持つのは `docs/ci.md`・`docs/agent-guidance/merge-evidence.md`（書き換える対象）と `docs/quality/review-checklist.md`（変更履歴の行で残す）の 3 つで、本 lane はどれも触らない。前の 2 つは lane 2b へ送る（下の S1 の前文と Review Focus Q1）。workflow の file の文言の変更で gate の green / red は変わらないが、触れば classifier が `workflow=true` を出し、helper（`scripts/pr-gate.py` の Double Audit の require）と `docs/DEV_WORKFLOW.md` Workflow State の `Final Review Minimum` の規則が 2 を求めるので、触らないことで R2・Final Review Minimum 1 を保つ。code の comment を触るので classifier の rust・frontend、function-design を触るので traceability の job は走る（comment と引用の文だけで、結果は変わらない）。

## Goal

Goal Invariant:

### 最小完了条件

- 設計の正本（`docs/` の設計書・runbook。lane 2b へ送る workflow の 2 file を除く）と code の comment（`src/`・`src-tauri/src/`）を読んだ人が、引用を `rg` で今の箇所へ辿れる。行番号の引用が無く（残すのは library の版を同じ行に書いた観測・変更履歴の行・規則の文の例だけ）、書き換えた symbol・節は、その引用が書かれた時点に指していた箇所と同じ物である。
- `docs/backlog.md` の行番号の引用は、全部「書いた時点の main の commit」を同じ行に持ち、`git show` でその commit の行を引くと引用の意図の箇所が出る（または symbol・節で引き直してある）。
- 書かれた時点の意図を取り戻せない引用は、本 packet の分類表に理由と処置が残り、今の行の中身を見て別の箇所へ付け替えていない。
- lane 2b が違反 0 の状態から検査を足せる: 2b へ送る workflow の 2 件を除き、正本と comment に残す行は分類表の「残す」の行だけである。

### 失敗定義

- ずれた行番号の今の行を見て、別の箇所の symbol・節へ書き換える（意図の取り違え。起点の調査の抜き取りでずれ率 45%）。
- backlog に添えた commit の時点で、その行番号が引用の意図の箇所を指さない。
- 時点の記録（`docs/design-system/reference/**`・`docs/decision-log.md` の本文・dated の Plan Packet と Matrix・`docs/archive/**`）、規則の文（D-125・DOC_STYLE_GUIDE §1）、data の行番号を書き換える。
- 引用以外の文を直す（引用を外したときに文が成り立つための最小の言い換えを越える）、code の振舞いを変える、bindings に出る doc comment を直して再生成を落とす。
- 店の運用の細部・実値・発言の原文を書く。

### 非目的

- 検査を足す（lane 2b）。規則の文（D-125・DOC_STYLE_GUIDE §1）を変える。
- 時点の記録の file（`docs/design-system/reference/**`）の頭に「行番号は某 commit の時点」の注記を足す（起点の調査の提案。DOC_STYLE_GUIDE §1 はそのまま残すと決めている）。
- 外部 library の行が今の版でも合うかを確かめ直す。
- 引用が支える文の中身が今の code と食い違っていても、その文を直す（S4 で backlog の 1 行へ送る）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

not applicable: operator の操作・data / command の契約・業務の状態遷移を変えない docs と comment の変更で、workflow の変更でもない（通常列は発注 → review → owner の Ready / merge）。

## Scope

### 数え直し（起点 `6a25f63f`）

下の AC の block の変数 `P`（起点の調査の抽出の式に `#L` の形を足した和）で数えた。区分と数（command と出力は Acceptance Criteria の baseline）:

| 区分 | 範囲（rg の path と glob） | 引用 | 行 | 本 lane |
|---|---|---|---|---|
| live な docs 全体 | `docs`・`AGENTS.md`・`CLAUDE.md`（`docs/archive/**`・`docs/evidence/**`・`docs/research/**`・`docs/plans/**` を除く） | 451 | — | 下の 4 区分の和 |
| 正本 | 上から `docs/backlog.md`・`docs/decision-log.md`・`docs/design-system/reference/**` を除く | 230 | 78 | S1（うち 6 行は残すか lane 2b へ送る） |
| backlog | `docs/backlog.md` | 82 | 31 | S3 |
| decision-log | `docs/decision-log.md` | 4 | — | 残す（append-only の本文） |
| 時点の記録 | `docs/design-system/reference/**` | 135 | — | 残す（下の表） |
| code の comment | `src`・`src-tauri/src`（`src/lib/invalidation-contract.static.test.ts` を除く） | 14 | 14 | S2 |
| 対象外 | `src/lib/invalidation-contract.static.test.ts` | 11 | — | 残す（test の data の文字列で comment でない） |

起点の調査（`18db621e`）との差: backlog が 121 → 82（lane 1 が閉じた項目を archive へ移した）、正本が 231 → 230（`10-common-rules.md` 43 → 42、`73-ui-stocktake.md` 3 → 2、`DOC_STYLE_GUIDE.md` の規則の例 +1）。`.agents`・`.claude/{rules,commands,agents}`・`README.md`・`.github`・`scripts` の hit は 0（`rg -c -e "$P" .agents .claude/rules .claude/commands .claude/agents README.md .github scripts` が何も出さない）。範囲の端（`9-12` の終わり・`41,140` の 2 つ目以降）は `rg -o` の数に入らないが、同じ引用として書き換える。

### 書き換えの方法（全段で共通）

最大の危険は、ずれた行番号の今の行を見て別の箇所の symbol に書き換えること。各引用について、書かれた時点の意図を次の手順で取り戻す。手順の 1〜4 の結果（採った版と書き換え先）を分類表の行に書く。

1. 候補を引く: 引用を含む行から、その引用を一意に含む文字列 X を決める（例 `seed_demo.rs:462`。bare の `` `:N` `` は、同じ行に前の path があればその path を含む塊〈例 `` lib.rs:118`・`:120 ``〉、無ければ `` `:N `` そのもの）。`git log --format='%h %p %ad %s' --abbrev=8 --date=short --pickaxe-regex -S'<X の正規表現の記号を \ で逃がした形>([^0-9]|$)' origin/main` の全 hit と、各 hit の親（`%p`。root `902647b8` には親が無い）を候補にし、古い順に並べる（squash merge なので、引用が hit の PR の中の変更の前の行を指すことがあり、親も候補に入れる）。次の 5 つは使わない（どれも分類表の中に誤った版を採る実例がある）:
   - path で絞る（`-- <doc>`）: backlog への移送・複写の commit を採り、その時点で行がずれている（`MonthlySalesPage.tsx:177` は path を絞ると `bc01698f`〈Plans → backlog の移送〉で、その版の 177 行は `<div className="rounded-md border">`。絞らない候補の `6fc4abac` とその親 `7e0ccf1b` では `<TableHead>部門</TableHead>`）。
   - 最古の 1 つを採る: 別の文書が別の文で同じ file:N を先に書いた commit が最古になる（`StockStatusBadge.tsx:36` の最古の hit `2f8a6f61` は `docs/Plans.md` の別の文で、その版の 36 行は「通常」。引用の「在庫あり」は `f2ef9e52` の版。X に閉じの backtick を付けても最古は `2f8a6f61` のまま。後ろの `([^0-9]|$)` が防ぐのは前方一致〈`lib.rs:118` が `lib.rs:1188-1200` に当たる〉だけ）。
   - 引用の前後の文を含む長い文字列: 同じ行の後の書き換えの commit を採る（`PriceRevisionTable.tsx:104` の長い文字列の最古は `c1c1c5bf` で、その版の 104 行は「最近改定」。引用の「入力中」は `07302b5e`〜`e188366e` の版）。
   - `-L N,N:<doc>`: 行の枠を遡り、引用より前の別の内容に抜ける（`docs/backlog.md:15` の `-L` の最古は `02f497ea` で、その版の 15 行は別の項目。引用を足したのは `c1c1c5bf`）。
   - `git blame`: 最後に行を触った commit を返す（`docs/backlog.md` の `seed_demo.rs:462` の行は blame が `18db621e`、引用を足した hit は `c1c1c5bf`）。

   target は引用の path（basename だけのときは 2 の末尾）。行に path が無い bare の `` `:N` `` の target は、同じ節の直前の path、節に無ければ文書の対象 module（例 `29-io-ej-parser.md` は `src-tauri/src/io/ej_parser.rs`）とし、どちらで決めたかを処置の欄に書く。
2. 版と symbol を決める: 先に、引用の文が名指す語（識別子・文字列・class 名。例「在庫あり」、`price_range_error`、`prev_month_comparison = Some(prev_items)`）を書き出す。候補を古い順に `git show {rev}:{target path} | sed -n '{N-3},{N+3}p'`（範囲 `N-M` は範囲全体）で読み、名指す語を含む symbol（関数・型・定数・test・JSX の要素・文）の中に行 N がある最古の候補を採る。JSX の開始 tag や fn の署名が行 N で、語がその中の後の行にある形は合う（`ManualSalePage.tsx:310` の `<PageHeader` と 312 行の `subtitle`。行 N の語だけで判じるとこの形を落とす）。±3 行に語があるだけでは採らない（`2f8a6f61` の 35 行に引用と同じ class 名があっても、36 行の「通常」は「在庫あり」の要素でない）。名指す語が無い引用は、行 N の中身が文の主題と合う最古の候補を採り、その中身を処置の欄に書く。合う候補が複数あり symbol が違えば 6。symbol が同じなら最古を採る（`lib.rs:118` は親 `02f497ea` と hit `dbb83251` のどちらも 118 行が `current_dir` の closure なので `02f497ea`）。target が basename だけのときは `git ls-tree -r --name-only {rev} | rg '/{basename}$'` で候補を出し、文脈で 1 つに決める（決まらなければ 6）。採った版の欄には commit の先頭 8 桁と、hit か親か（例 `44f1e666`〈親〉）を書く。
3. その版の行が属する symbol（関数・型・定数・test の名前と、中の目印の語）か節（節の ID か見出し）を決める。
4. 今の base で `rg -n '{symbol か節の ID・見出し}' {今の path}` がその symbol・節を出すことを確かめる（file が改名されていれば `git log --follow --name-status` で今の path を引く）。
5. 書き換える:
   - 正本と code の comment: repo root からの path と symbol（範囲は symbol と中の目印の語）。文書は節の ID か見出し。同じ文書の中の bare の `` `:N` `` も節の ID か見出しにする。bare の `` `:N` `` の隣に symbol が既に書いてある引用（例 `parse_item_count`〈`:1289`〉）は、採った版でその symbol が行 N を含むことを確かめて `:N` だけを外す。引用の近くの時点の句（例 S2-008 の「`b2389b19` 起源」）は、symbol で引き直した後も残す理由があるかを処置の欄で判じる（残すなら理由、外すならその旨）。
   - backlog: 「`{sha8}` の時点で `{path}:{N}`」（sha8 は 2 で採った版の先頭 8 桁。親を採ったら親の SHA。`{path}` は repo root からの path〈1・2 で決めた target〉）。同じ行の引用が別の版から来るときは、版ごとにこの句を置く。symbol・節で引き直してもよい（そのときは SHA を添えない）。
   - 外部 library（`node_modules` の file・vendored の source）: 行番号は残し、同じ行に library の名前と版を書く（例「TanStack Router 1.168.23」）。版は、引用を足した hit（その文書の差分の `+` 行にその引用がある最古の hit）の時点の `package-lock.json` か `Cargo.lock` から、引いている package の版で引く（`@tanstack/router-core` と `@tanstack/react-router` は版が違う。`01-decision-rules.md:389` は 2 つを書き分けている）。DOC_STYLE_GUIDE §1 の「library の版を書いた観測」の形。下の AC の変数 `K` の library の名前の一覧に入る名前で書く。
   - repo の外の資料: 同じ行に節の ID（例 `Q12 §1`）があれば行番号を外す。
6. 取り戻せない（候補のどれも 2 で合わない〈root `902647b8` だけが候補で合わない行を含む〉、3 の symbol・節が今の base に無い、target が決まらない）引用は、書き換えずに分類表の処置を「消えた（理由）」か「曖昧（理由）」とし、S4 で始末する。読んだ候補と行 N の中身は S5 の照合の入力（採った版 `-`）の evidence に出る。

手順 1〜2 の試し（2 件）:

- `docs/backlog.md` の `src-tauri/src/seed_demo.rs:462`（「`sale_auto` の movement」）: 候補は親 `44f1e666` と hit `c1c1c5bf`（PR #176）。古い順に、`git show 44f1e666:src-tauri/src/seed_demo.rs` の 462 行は `sale_auto` の movement の INSERT の文で合う → 採る版は `44f1e666`〈親〉（`c1c1c5bf` の 462 行は冪等性の検査の comment で合わない）。親を候補に入れる理由の実例。
- `docs/function-design/10-common-rules.md` の `product_service.rs:949`〜`:957`（「`price_range_error`」）: 候補は親 `67870e10` と hit `6cac578c`（PR #158）。`67870e10` の版には `price_range_error` が無く、949 行は別の関数の中で合わない。`git show 6cac578c:src-tauri/src/biz/product_service.rs` の 949 行が `fn price_range_error(`、950〜957 行がその本体で合う → 採る版は `6cac578c`〈hit〉、書き換え先は `src-tauri/src/biz/product_service.rs` の `price_range_error`。今の base では `rg -n 'fn price_range_error' src-tauri/src/biz/product_service.rs` が 965 行に出す（行番号はずれた）。

### S1 正本（78 行、230 引用）

分類表の S1 の行（下の「分類表」）を、上の方法で書き換える。対象の file: `docs/design-system/00-foundations.md`・`01-decision-rules.md`・`02-component-catalog.md`、`docs/function-design/` の 10・22・24・29・31・32・37・45・55・56・57・58・66・71・73、`docs/msi-distribution-runbook.md`。

起票の時点で処置が決まっている 6 行（表に書き込み済み）:

- 残す 4 行: `docs/DOC_STYLE_GUIDE.md:87`（規則の文の例。時点の commit つき）、`docs/quality/review-checklist.md:123` と `docs/design-system/02-component-catalog.md:1063`（変更履歴の表の行。時点の記録）、`docs/design-system/01-decision-rules.md:389`（「TanStack Router 1.168.23」の版つきの library の観測）。
- lane 2b へ送る 2 行: `docs/ci.md:29`（`scripts/pr-gate.py:398-410`）と `docs/agent-guidance/merge-evidence.md:160`（`docs/templates/subagent-review-packet.md:15`）。workflow の file で、触ると Final Review Minimum が 2 になる（上の Risk）。lane 2b は `scripts/doc-consistency-check.sh` を変えて元から `workflow=true` の Double Audit なので、同じ lane で直してから検査を入れる。

型が決まっている行: `01-decision-rules.md` の 419・420・421・423 と `22-mnt-migration.md` の 234 は外部 library（方法の 5 の library の形。22:234 は `tauri-plugin-dialog` の vendored の source）、`01-decision-rules.md:138` は repo の中の `RootLayout.tsx:62` と repo の外の資料（`ui-design-rules-qa-v2.md` の `:419`・`:424-433`。同じ行に `Q12 §1`・`Q12 §2/§3` がある）。

### S2 code の comment（14 行、14 引用）

分類表の S2 の行を、上の方法で書き換える（正本と同じ形。外部 library の 3 行〈S2-009〜S2-011、TanStack Router の `scroll-restoration.js`・happy-dom の `Element.js`・`HTMLElement.js`〉は library の形）。`DSR-22` の bare の `` `:443` ``（S2-002・S2-003）は `docs/design-system/01-decision-rules.md` の DSR-22 で引く。

bindings: 直す comment が `#[derive(specta::Type)]` の型か `#[specta::specta]` の command の doc comment なら、同じ段で `cd src-tauri && cargo run --bin generate_bindings` を回し、`src/lib/bindings.ts` の差分を同じ commit に入れる（2026-10-18 に再生成の書き落としで Draft CI が赤になった先例）。起票の時点で S2 の Rust の行は S2-001 だけで、`src-tauri/src/biz/csv_import_service/time_evidence.rs` の `pub(crate) fn receive_source` の doc comment（`csv_import_service/mod.rs` で `#[cfg(test)]` の module）なので bindings に出ない。AC-S2-3 で確かめる。

### S3 backlog（31 行、82 引用）

分類表の S3 の行を、上の方法で書き換える（backlog の形）。採った版の SHA は main に在る commit（AC-S3-2）。同じ行に別の版から来た引用があれば、版ごとに句を置く。引用の文の中身（項目の申し送りの内容）は変えない。

### S4 消えた・曖昧の始末

S1〜S3 で処置を「消えた（理由）」「曖昧（理由）」にした行を、1 行ずつ次のどれかにし、処置の欄に書く:

- 引用を外す: 引用が無くても文が成り立つ（引用は根拠の添え物）。文は変えない。
- 最小の言い換え: 引用を外すと文が成り立たない。引用の語だけを、今の base で在る symbol・節に替える。替える symbol は引用の文自身が名指す語から決め（例 `prev_month_comparison = Some(prev_items)` → `rg` で `get_monthly_sales`）、名指す語が無ければ言い換えず「引用を外す」か backlog の 1 句へ送る。今の行 N の中身（例 `sales_service.rs:196` の今の `pub count: usize`）は根拠にしない。替えた語が書かれた時点の意図と合う根拠（名指す語と、それが今どの symbol にあるか）を処置の欄に 1 句で書く。
- backlog に限り、意図の箇所が分かる版がある（3 の symbol が今は無い）なら「`{sha8}` の時点で」を添えて当時の行として残す。
- 引用が支える文の中身が今の code・正本と食い違う（指す物が消えた・変わった）ときは、文を直さず、`docs/backlog.md` の「次の docs の lane の候補（docs の棚卸し lane 1 の残り）」の項目に 1 句を足す（file と節と食い違いの要旨）。足した句を処置の欄に書く。

### S5 分類表の照合

分類表の全行の処置が「書き換えた」「残す（理由）」「lane 2b へ送る」「消えた・曖昧（処置）」のどれかで、未処置が無いこと。

全引用の照合の evidence: 分類表の S1〜S3 の行のうち処置が「書き換えた」「消えた」「曖昧」の行の、repo の中の file を target にする引用ごとに、下の「照合の入力」の block に 1 行（`ID 採った版 target N X`。採った版は 2 で採った commit の先頭 8 桁で、取り戻せない引用は `-`。N は行か範囲 `N-M`。X は 1 の文字列で、行の残り全部）を書く。外部 library・repo 外の資料の引用は書かない。AC-S5-5 の loop の出力（引用ごとの候補の一覧と各候補の行 N の中身、採った版の行 N〜M）を PR に残す。人手の判断（名指す語の symbol の中に行 N があるか）は、採った版の抜き取り（下の Implementation Results の約束）の表で確かめる。

### 分類表

型の語: 正本・comment・backlog（上の段）、外部 library、repo 外の資料、変更履歴、規則の例、workflow。処置の語: 「書き換えた」「残す（理由）」「lane 2b へ送る」「消えた（理由）→ 処置」「曖昧（理由）→ 処置」。採った版は方法の 2 で採った commit の先頭 8 桁と、hit か親か（例 `44f1e666`〈親〉）を引用の順に `・` で区切って書き、照合の入力の行と同じ版にする（AC-S5-5 が照らす）。書き換え先は symbol・節の名前、backlog は付けた句。引用の列は `rg -o` が拾った位置で、範囲の終わりと `,` の 2 つ目以降は省いている。行は起点の行番号で、作業中にずれる（場所の path と引用の文字列で引き直す）。

#### S1 の行

| ID | 場所（`6a25f63f` の行） | 引用（`rg -o` の順） | 型 | 採った版 | 書き換え先 | 処置 |
|---|---|---|---|---|---|---|
| S1-001 | `docs/DOC_STYLE_GUIDE.md:87` | `src-tauri/src/biz/product_service.rs:965` | 規則の例 | — | — | 残す（規則の文の例。時点の commit つき） |
| S1-002 | `docs/agent-guidance/merge-evidence.md:160` | `docs/templates/subagent-review-packet.md:15` | workflow | — | — | lane 2b へ送る（workflow の file） |
| S1-003 | `docs/ci.md:29` | `scripts/pr-gate.py:398` | workflow | — | — | lane 2b へ送る（workflow の file） |
| S1-004 | `docs/design-system/00-foundations.md:188` | `StocktakePage.tsx:933` | 正本 |  |  | 未処置 |
| S1-005 | `docs/design-system/01-decision-rules.md:120` | `ListShell.tsx:69` | 正本 |  |  | 未処置 |
| S1-006 | `docs/design-system/01-decision-rules.md:126` | `InventoryRecordsPage.tsx:356`・`:353`・`:349` | 正本 |  |  | 未処置 |
| S1-007 | `docs/design-system/01-decision-rules.md:127` | `StockMovementsPage.tsx:73`・`MovementTable.tsx:52` | 正本 |  |  | 未処置 |
| S1-008 | `docs/design-system/01-decision-rules.md:128` | `OperationLogsPage.tsx:461` | 正本 |  |  | 未処置 |
| S1-009 | `docs/design-system/01-decision-rules.md:129` | `SupplierUsageTable.tsx:19` | 正本 |  |  | 未処置 |
| S1-010 | `docs/design-system/01-decision-rules.md:130` | `BackupRestorePage.tsx:520` | 正本 |  |  | 未処置 |
| S1-011 | `docs/design-system/01-decision-rules.md:132` | `2026-08-23-current-design-analysis.md:18` | 正本 |  |  | 未処置 |
| S1-012 | `docs/design-system/01-decision-rules.md:134` | `InventoryRecordsPage.tsx:349` | 正本 |  |  | 未処置 |
| S1-013 | `docs/design-system/01-decision-rules.md:136` | `StockStatusBadge.tsx:41` | 正本 |  |  | 未処置 |
| S1-014 | `docs/design-system/01-decision-rules.md:138` | `RootLayout.tsx:62`・`:419`・`:424` | 正本 + repo 外の資料 |  |  | 未処置 |
| S1-015 | `docs/design-system/01-decision-rules.md:389` | `router-core/dist/esm/router.d.ts:309`・`router.js:415`・`:427`・`:118`・`:119`・`:146`・`:147` | 外部 library | — | — | 残す（library の版つきの観測） |
| S1-016 | `docs/design-system/01-decision-rules.md:414` | `RootLayout.tsx:65` | 正本 |  |  | 未処置 |
| S1-017 | `docs/design-system/01-decision-rules.md:419` | `router-core/dist/esm/router.js:415`・`scroll-restoration.js:118` | 外部 library |  |  | 未処置 |
| S1-018 | `docs/design-system/01-decision-rules.md:420` | `scroll-restoration.js:122` | 外部 library |  |  | 未処置 |
| S1-019 | `docs/design-system/01-decision-rules.md:421` | `scroll-restoration.js:73` | 外部 library |  |  | 未処置 |
| S1-020 | `docs/design-system/01-decision-rules.md:423` | `router.js:118`・`react-router/dist/esm/Match.js:112` | 外部 library |  |  | 未処置 |
| S1-021 | `docs/design-system/02-component-catalog.md:53` | `SupplierManagementPage.tsx:35` | 正本 |  |  | 未処置 |
| S1-022 | `docs/design-system/02-component-catalog.md:55` | `ReceivingPage.tsx:295`・`ManualSalePage.tsx:310`・`ReturnExchangePage.tsx:419`・`DisposalPage.tsx:285`・`SupplierManagementPage.tsx:35`・`PageHeader.tsx:47`・`PageHeader.tsx:31` | 正本 |  |  | 未処置 |
| S1-023 | `docs/design-system/02-component-catalog.md:200` | `MovementTable.tsx:93`・`OperationLogsPage.tsx:533`・`MovementTable.tsx:93`・`ManualSaleRecordDetailPage.tsx:149`・`MovementTable.tsx:82`・`StocktakeRecordDetailPage.tsx:234` | 正本 |  |  | 未処置 |
| S1-024 | `docs/design-system/02-component-catalog.md:415` | `PriceRevisionPage.tsx:79`・`DailySalesPage.tsx:175`・`MonthlySalesPage.tsx:166` | 正本 |  |  | 未処置 |
| S1-025 | `docs/design-system/02-component-catalog.md:888` | `StockStatusBadge.tsx:29`・`StocktakePage.tsx:396`・`csv-import/components/PreviewStep.tsx:75`・`ProductTable.tsx:88`・`ResultStep.tsx:47`・`CsvImportRecordDetailPage.tsx:140` | 正本 |  |  | 未処置 |
| S1-026 | `docs/design-system/02-component-catalog.md:889` | `IntegrityCheckPage.tsx:389`・`StocktakePage.tsx:404`・`ProductTable.tsx:93`・`ResultStep.tsx:47`・`DailyReportImportPage.tsx:164`・`CsvImportRecordDetailPage.tsx:140`・`DailyReportImportPage.tsx:322` | 正本 |  |  | 未処置 |
| S1-027 | `docs/design-system/02-component-catalog.md:890` | `StockStatusBadge.tsx:20`・`CsvImportRecordDetailPage.tsx:41`・`:192` | 正本 |  |  | 未処置 |
| S1-028 | `docs/design-system/02-component-catalog.md:891` | `StockStatusBadge.tsx:36`・`inventory-records/types.ts:87` | 正本 |  |  | 未処置 |
| S1-029 | `docs/design-system/02-component-catalog.md:893` | `IntegrityCheckPage.tsx:469`・`PriceRevisionTable.tsx:104`・`ProductTable.tsx:74`・`CsvImportRecordDetailPage.tsx:194`・`ReturnExchangePage.tsx:97`・`ReturnExchangePage.tsx:592`・`ReturnExchangePage.tsx:602` | 正本 |  |  | 未処置 |
| S1-030 | `docs/design-system/02-component-catalog.md:895` | `ProductTable.tsx:56`・`ProductTable.tsx:74`・`PriceRevisionTable.tsx:98`・`daily-sales/components/ProductTable.tsx:133` | 正本 |  |  | 未処置 |
| S1-031 | `docs/design-system/02-component-catalog.md:899` | `PriceRevisionTable.tsx:104` | 正本 |  |  | 未処置 |
| S1-032 | `docs/design-system/02-component-catalog.md:1063` | `PriceRevisionPage.tsx:112`・`:158` | 変更履歴 | — | — | 残す（変更履歴の行） |
| S1-033 | `docs/function-design/10-common-rules.md:121` | `stocktake_service.rs:529`・`src/features/stock-inquiry/lib/filter-low-stock-list.ts:62`・`:63`・`src/features/products/search.ts:30` | 正本 |  |  | 未処置 |
| S1-034 | `docs/function-design/10-common-rules.md:165` | `receiving.rs:126`・`manual_sale.rs:141`・`disposal.rs:123`・`returns.rs:99`・`returns.rs:254`・`:255` | 正本 |  |  | 未処置 |
| S1-035 | `docs/function-design/10-common-rules.md:166` | `csv_import_service/parse.rs:98`・`:110`・`csv_import_service/commit.rs:138`・`:167` | 正本 |  |  | 未処置 |
| S1-036 | `docs/function-design/10-common-rules.md:167` | `inventory_service/common.rs:82`・`:87`・`product_service.rs:1062`・`:1069`・`:1316`・`:1324`・`csv_import_service/commit.rs:276`・`integrity_service.rs:192` | 正本 |  |  | 未処置 |
| S1-037 | `docs/function-design/10-common-rules.md:168` | `product_service.rs:949`・`:957`・`:1059`・`:1103`・`:473`・`:474`・`:1285` | 正本 |  |  | 未処置 |
| S1-038 | `docs/function-design/10-common-rules.md:169` | `product_service.rs:1059`・`:1106`・`:473`・`:474`・`:1291`・`receiving.rs:138`・`disposal.rs:135` | 正本 |  |  | 未処置 |
| S1-039 | `docs/function-design/10-common-rules.md:173` | `src/features/products/lib/price-revision-math.ts:1`・`:9` | 正本 |  |  | 未処置 |
| S1-040 | `docs/function-design/10-common-rules.md:209` | `product_service.rs:907`・`:927`・`product_repo.rs:1310`・`:1311` | 正本 |  |  | 未処置 |
| S1-041 | `docs/function-design/22-mnt-migration.md:234` | `lib.rs:355` | 外部 library |  |  | 未処置 |
| S1-042 | `docs/function-design/22-mnt-migration.md:353` | `product_service.rs:274`・`:285` | 正本 |  |  | 未処置 |
| S1-043 | `docs/function-design/22-mnt-migration.md:360` | `schema_time_evidence.rs:120`・`:124` | 正本 |  |  | 未処置 |
| S1-044 | `docs/function-design/22-mnt-migration.md:378` | `src-tauri/src/lib.rs:1214`・`:1223`・`lib.rs:161`・`src-tauri/src/db/mod.rs:298`・`src-tauri/src/mnt/restore.rs:11`・`:13`・`src-tauri/src/mnt/backup.rs:206`・`:210`・`lib.rs:1227`・`src-tauri/src/io/image_manager.rs:15`・`:58` | 正本 |  |  | 未処置 |
| S1-045 | `docs/function-design/22-mnt-migration.md:379` | `lib.rs:118`・`:120`・`lib.rs:165`・`:183`・`db/mod.rs:296` | 正本 |  |  | 未処置 |
| S1-046 | `docs/function-design/22-mnt-migration.md:386` | `lib.rs:1219`・`:1223` | 正本 |  |  | 未処置 |
| S1-047 | `docs/function-design/22-mnt-migration.md:389` | `restore.rs:690`・`:700`・`lib.rs:188`・`:195` | 正本 |  |  | 未処置 |
| S1-048 | `docs/function-design/24-io-csv-import-repo.md:556` | `src-tauri/src/db/sales_repo.rs:760` | 正本 |  |  | 未処置 |
| S1-049 | `docs/function-design/24-io-csv-import-repo.md:705` | `src-tauri/src/biz/mod.rs:26`・`:28`・`:30`・`src-tauri/src/db/sales_repo.rs:13`・`:19`・`:862`・`:873` | 正本 |  |  | 未処置 |
| S1-050 | `docs/function-design/29-io-ej-parser.md:323` | `:41`・`:190`・`:57`・`:1289`・`:174`・`:776`・`:814`・`:707`・`:717` | 正本 |  |  | 未処置 |
| S1-051 | `docs/function-design/31-biz-inventory-service.md:10` | `src-tauri/src/biz/csv_import_service/commit.rs:157` | 正本 |  |  | 未処置 |
| S1-052 | `docs/function-design/31-biz-inventory-service.md:28` | `receiving.rs:126`・`manual_sale.rs:141`・`disposal.rs:123`・`returns.rs:99`・`returns.rs:254`・`:255`・`receiving.rs:156`・`disposal.rs:159` | 正本 |  |  | 未処置 |
| S1-053 | `docs/function-design/31-biz-inventory-service.md:29` | `receiving.rs:138`・`disposal.rs:135` | 正本 |  |  | 未処置 |
| S1-054 | `docs/function-design/31-biz-inventory-service.md:32` | `receiving.rs:234`・`returns.rs:273`・`manual_sale.rs:289`・`disposal.rs:226` | 正本 |  |  | 未処置 |
| S1-055 | `docs/function-design/32-biz-csv-import-service.md:21` | `src-tauri/src/biz/csv_import_service/parse.rs:63` | 正本 |  |  | 未処置 |
| S1-056 | `docs/function-design/37-biz-daily-report-import-service.md:256` | `src-tauri/src/biz/mod.rs:54`・`useDailyReportImportFlow.ts:35` | 正本 |  |  | 未処置 |
| S1-057 | `docs/function-design/37-biz-daily-report-import-service.md:261` | `src/lib/bindings.ts:558`・`commit.rs:83` | 正本 |  |  | 未処置 |
| S1-058 | `docs/function-design/37-biz-daily-report-import-service.md:552` | `src-tauri/src/biz/daily_report_import_service/parse.rs:159`・`tests.rs:275`・`:481`・`:536` | 正本 |  |  | 未処置 |
| S1-059 | `docs/function-design/37-biz-daily-report-import-service.md:633` | `src-tauri/src/db/sales_repo.rs:13` | 正本 |  |  | 未処置 |
| S1-060 | `docs/function-design/37-biz-daily-report-import-service.md:669` | `src-tauri/src/io/ej_parser.rs:455`・`:460` | 正本 |  |  | 未処置 |
| S1-061 | `docs/function-design/37-biz-daily-report-import-service.md:673` | `src-tauri/src/io/ej_parser.rs:678`・`:689`・`:575`・`:581` | 正本 |  |  | 未処置 |
| S1-062 | `docs/function-design/37-biz-daily-report-import-service.md:674` | `:832`・`:834` | 正本 |  |  | 未処置 |
| S1-063 | `docs/function-design/45-cmd-daily-report-import.md:56` | `src-tauri/src/cmd/daily_report_import_cmd.rs:43`・`:242` | 正本 |  |  | 未処置 |
| S1-064 | `docs/function-design/45-cmd-daily-report-import.md:242` | `src/features/daily-report-import/hooks/useDailyReportImportFlow.ts:35`・`src-tauri/src/cmd/mod.rs:130` | 正本 |  |  | 未処置 |
| S1-065 | `docs/function-design/45-cmd-daily-report-import.md:246` | `src-tauri/src/lib.rs:277`・`:1272` | 正本 |  |  | 未処置 |
| S1-066 | `docs/function-design/55-ui-csv-import.md:35` | `useDailyReportImportFlow.ts:35`・`reducer.ts:56`・`reducer.ts:77`・`src/features/daily-report-import/types.ts:4` | 正本 |  |  | 未処置 |
| S1-067 | `docs/function-design/56-ui-daily-sales.md:375` | `compute-summary.ts:14` | 正本 |  |  | 未処置 |
| S1-068 | `docs/function-design/56-ui-daily-sales.md:579` | `navigation.ts:76` | 正本 |  |  | 未処置 |
| S1-069 | `docs/function-design/56-ui-daily-sales.md:581` | `RootLayout.tsx:33` | 正本 |  |  | 未処置 |
| S1-070 | `docs/function-design/57-ui-monthly-sales.md:31` | `sales_service.rs:196` | 正本 |  |  | 未処置 |
| S1-071 | `docs/function-design/57-ui-monthly-sales.md:164` | `sort-items.test.ts:79` | 正本 |  |  | 未処置 |
| S1-072 | `docs/function-design/57-ui-monthly-sales.md:422` | `sales_service.rs:196` | 正本 |  |  | 未処置 |
| S1-073 | `docs/function-design/58-ui-stock-inquiry.md:613` | `DisposalPage.tsx:134` | 正本 |  |  | 未処置 |
| S1-074 | `docs/function-design/66-ui-stock-movements.md:71` | `product_repo.rs:1845` | 正本 |  |  | 未処置 |
| S1-075 | `docs/function-design/71-mnt-backup.md:201` | `backup.rs:263` | 正本 |  |  | 未処置 |
| S1-076 | `docs/function-design/73-ui-stocktake.md:68` | `product_repo.rs:804`・`02-component-catalog.md:157` | 正本 |  |  | 未処置 |
| S1-077 | `docs/msi-distribution-runbook.md:27` | `:201`・`:203`・`:1214`・`:1223`・`:1225`・`:1233`・`:1241` | 正本 |  |  | 未処置 |
| S1-078 | `docs/quality/review-checklist.md:123` | `:86` | 変更履歴 | — | — | 残す（変更履歴の行） |

#### S2 の行

| ID | 場所（`6a25f63f` の行） | 引用（`rg -o` の順） | 型 | 採った版 | 書き換え先 | 処置 |
|---|---|---|---|---|---|---|
| S2-001 | `src-tauri/src/biz/csv_import_service/time_evidence.rs:25` | `parse.rs:80` | comment |  |  | 未処置 |
| S2-002 | `src/components/ui/segmented-control.test.tsx:7` | `:443` | comment |  |  | 未処置 |
| S2-003 | `src/components/ui/segmented-control.tsx:6` | `:443` | comment |  |  | 未処置 |
| S2-004 | `src/features/monthly-sales/components/SummaryCardsBar.tsx:97` | `sales_service.rs:196` | comment |  |  | 未処置 |
| S2-005 | `src/features/monthly-sales/hooks/useMonthlySalesReport.test.tsx:156` | `sales_service.rs:196` | comment |  |  | 未処置 |
| S2-006 | `src/features/monthly-sales/hooks/useMonthlySalesReport.ts:76` | `sort-items.test.ts:79` | comment |  |  | 未処置 |
| S2-007 | `src/features/monthly-sales/lib/compute-comparison.ts:10` | `sales_service.rs:196` | comment |  |  | 未処置 |
| S2-008 | `src/features/products/ProductListPage.bulk-dialog-target.test.tsx:6` | `ProductListPage.tsx:303` | comment |  |  | 未処置 |
| S2-009 | `src/features/products/ProductListPage.scroll-restoration.test.tsx:16` | `scroll-restoration.js:147` | comment（外部 library） |  |  | 未処置 |
| S2-010 | `src/features/products/ProductListPage.scroll-restoration.test.tsx:62` | `node_modules/happy-dom/lib/nodes/element/Element.js:133` | comment（外部 library） |  |  | 未処置 |
| S2-011 | `src/features/products/ProductListPage.scroll-restoration.test.tsx:64` | `html-element/HTMLElement.js:460` | comment（外部 library） |  |  | 未処置 |
| S2-012 | `src/features/products/components/ProductForm.test.tsx:915` | `ProductForm.tsx:284` | comment |  |  | 未処置 |
| S2-013 | `src/features/products/components/ProductForm.test.tsx:924` | `ProductForm.tsx:282` | comment |  |  | 未処置 |
| S2-014 | `src/features/stocktake/StocktakePage.tsx:759` | `Pagination.tsx:48` | comment |  |  | 未処置 |

#### S3 の行

| ID | 場所（`6a25f63f` の行） | 引用（`rg -o` の順） | 型 | 採った版 | 書き換え先 | 処置 |
|---|---|---|---|---|---|---|
| S3-001 | `docs/backlog.md:15` | `src-tauri/src/seed_demo.rs:462` | backlog |  |  | 未処置 |
| S3-002 | `docs/backlog.md:27` | `parse.rs:159`・`tests.rs:275`・`:481`・`:536` | backlog |  |  | 未処置 |
| S3-003 | `docs/backlog.md:49` | `:164`・`:657`・`:658`・`:370`・`:196`・`:751`・`:754`・`:907`・`:30`・`:179`・`docs/function-design/62-ui-manual-sale.md:167` | backlog |  |  | 未処置 |
| S3-004 | `docs/backlog.md:50` | `src-tauri/src/biz/inventory_service/manual_sale.rs:147` | backlog |  |  | 未処置 |
| S3-005 | `docs/backlog.md:51` | `src/features/manual-sale/lib/manual-sale-row-utils.ts:67`・`:82` | backlog |  |  | 未処置 |
| S3-006 | `docs/backlog.md:53` | `docs/function-design/35-biz-stocktake-service.md:473`・`docs/function-design/44-cmd-inventory.md:966`・`docs/DB_DESIGN.md:187`・`:763`・`:1460`・`:1520`・`:1528`・`:1541`・`:1708`・`:452` | backlog |  |  | 未処置 |
| S3-007 | `docs/backlog.md:57` | `src-tauri/src/db/schema_v8.rs:255`・`:10`・`:15`・`:14`・`:262`・`src-tauri/src/constants.rs:65` | backlog |  |  | 未処置 |
| S3-008 | `docs/backlog.md:77` | `src-tauri/src/biz/product_service.rs:1536`・`src-tauri/src/constants.rs:38` | backlog |  |  | 未処置 |
| S3-009 | `docs/backlog.md:95` | `docs/function-design/21-io-inventory-repo.md:103`・`:354`・`docs/function-design/62-ui-manual-sale.md:26`・`:165`・`src/features/manual-sale/lib/manual-sale-row-utils.ts:24` | backlog |  |  | 未処置 |
| S3-010 | `docs/backlog.md:98` | `product_service.rs:153` | backlog |  |  | 未処置 |
| S3-011 | `docs/backlog.md:118` | `src/features/csv-import/lib/formatErrorRow.ts:22` | backlog |  |  | 未処置 |
| S3-012 | `docs/backlog.md:119` | `src/features/products/components/PriceRevisionTable.tsx:104` | backlog |  |  | 未処置 |
| S3-013 | `docs/backlog.md:121` | `src/components/patterns/EmptyState.tsx:32` | backlog |  |  | 未処置 |
| S3-014 | `docs/backlog.md:129` | `:841`・`:70` | backlog |  |  | 未処置 |
| S3-015 | `docs/backlog.md:145` | `docs/design-system/reference/mockup-d-lists.html:112` | backlog |  |  | 未処置 |
| S3-016 | `docs/backlog.md:173` | `:155` | backlog |  |  | 未処置 |
| S3-017 | `docs/backlog.md:183` | `PluExportPage.tsx:188` | backlog |  |  | 未処置 |
| S3-018 | `docs/backlog.md:184` | `ReturnExchangePage.tsx:185` | backlog |  |  | 未処置 |
| S3-019 | `docs/backlog.md:188` | `src-tauri/src/biz/stocktake_service.rs:4`・`docs/function-design/35-biz-stocktake-service.md:374`・`docs/architecture/biz-task-specs.md:451`・`docs/db-design/tracking-system-tables.md:137`・`docs/screen_mockups.html:208`・`docs/screen_mockups.html:259`・`docs/SCREEN_DESIGN.md:213` | backlog |  |  | 未処置 |
| S3-020 | `docs/backlog.md:204` | `40-cmd-product.md:279` | backlog |  |  | 未処置 |
| S3-021 | `docs/backlog.md:223` | `61-ui-receiving.md:30`・`63-ui-return-exchange.md:36` | backlog |  |  | 未処置 |
| S3-022 | `docs/backlog.md:245` | `MonthlySalesPage.tsx:177` | backlog |  |  | 未処置 |
| S3-023 | `docs/backlog.md:247` | `ReceivingPage.tsx:543` | backlog |  |  | 未処置 |
| S3-024 | `docs/backlog.md:249` | `ReturnExchangePage.tsx:790` | backlog |  |  | 未処置 |
| S3-025 | `docs/backlog.md:251` | `ReturnExchangePage.tsx:624` | backlog |  |  | 未処置 |
| S3-026 | `docs/backlog.md:259` | `InventoryRecordsPage.tsx:156`・`ReceivingPage.tsx:393`・`DisposalPage.tsx:509`・`OperationLogsPage.tsx:338` | backlog |  |  | 未処置 |
| S3-027 | `docs/backlog.md:261` | `Pagination.tsx:52` | backlog |  |  | 未処置 |
| S3-028 | `docs/backlog.md:299` | `ProductImportPreview.tsx:76`・`ProductRankingTable.tsx:80`・`BackupRestorePage.tsx:533` | backlog |  |  | 未処置 |
| S3-029 | `docs/backlog.md:303` | `StockStatusBadge.tsx:42`・`01-decision-rules.md:445`・`04-backbone.md:44`・`02-component-catalog.md:158`・`DailyReportImportPage.tsx:322`・`ProductTable.tsx:133` | backlog |  |  | 未処置 |
| S3-030 | `docs/backlog.md:334` | `button.tsx:15` | backlog |  |  | 未処置 |
| S3-031 | `docs/backlog.md:341` | `list.rs:21` | backlog |  |  | 未処置 |

#### 照合の入力

S5 の全引用の照合の evidence の入力（形は S5。実装の run が埋める）。

```text 照合の入力
# ID 採った版 target N X
```

#### 残す区分（file ごと）

| file | 引用 | 処置 |
|---|---|---|
| `docs/design-system/reference/2026-08-20-proposal-A-rules-bound.md` | 53 | 残す（dated の提案） |
| `docs/design-system/reference/2026-08-20-proposal-B-blank-slate.md` | 37 | 残す（dated の提案） |
| `docs/design-system/reference/mockup-e-badge-cta-samples.html` | 14 | 残す（参考の mockup） |
| `docs/design-system/reference/mockup-d-import-export.html` | 9 | 残す（参考の mockup） |
| `docs/design-system/reference/mockup-d-history.html` | 6 | 残す（参考の mockup） |
| `docs/design-system/reference/mockup-d-home-sales-admin.html` | 4 | 残す（参考の mockup） |
| `docs/design-system/reference/mockup-d-stocktake.html` | 4 | 残す（参考の mockup） |
| `docs/design-system/reference/mockup-d-lists.html` | 3 | 残す（参考の mockup） |
| `docs/design-system/reference/mockup-d-forms-b.html` | 2 | 残す（参考の mockup） |
| `docs/design-system/reference/2026-08-23-current-design-analysis.md` | 1 | 残す（dated の分析） |
| `docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md` | 1 | 残す（dated の L3 の記録） |
| `docs/design-system/reference/README.md` | 1 | 残す（参考資料の索引。頭に「実装の正本ではない」と書く。引用は mockup の説明の中） |
| `docs/decision-log.md` | 4 | 残す（append-only の本文） |
| `src/lib/invalidation-contract.static.test.ts` | 11 | 対象外（test の data の文字列） |

### 他の lane との重なり

- Draft の PR #172（`agent/sd-direct-read-runtime`）は `docs/backlog.md` と `docs/function-design/` の 22・29・37・45・55 を、Draft の PR #155（`agent/backup-offsite`）は `docs/backlog.md` と 22・71 を触る（`gh pr view {番号} --json files`、起票の時点）。後に merge する側が `origin/main` の単段 merge で同期する（`docs/DEV_WORKFLOW.md` Wave Operation）。本 lane が後なら、同期の後に下の baseline の command を測り直し、増えた引用の行を分類表に足して同じ方法で始末する。
- lane 2b（検査）: 本 lane の merge の後。分類表の「lane 2b へ送る」2 行と、残す行の形（`K` の 3 つの形）を 2b の検査の入力にする。

## Non-scope

- 検査の追加（lane 2b）と、`scripts/doc-consistency-check.sh` を含む workflow の file の変更（`docs/ci.md`・`docs/agent-guidance/merge-evidence.md` の引用は lane 2b へ送る）。
- 規則の文（D-125・DOC_STYLE_GUIDE §1）の変更。
- 引用以外の文の直し（直す文の中に引用がある場合の最小の言い換えはよい。S4）。
- 時点の記録（`docs/design-system/reference/**`・`docs/decision-log.md` の本文・dated の Plan Packet と Matrix・`docs/archive/**`・`docs/evidence/**`・`docs/research/**`）と data の行番号。
- reference の file の頭に時点の注記を足すこと、外部 library の行の今の版での照合。
- code の振舞い・test の assertion の変更（comment の行だけを直す）。

## Acceptance Criteria

AC の command は repo root で、次の 2 つの変数を同じ shell に定義してから実行する（bash・zsh）。`P` は file:行 の引用の 3 つの形（`path:N`・bare の `` `:N` ``・`#LN`）、`K` は残す行の 3 つの形（library の名前と版、backlog の時点の句、変更履歴の表の行）。

```sh
P='\.(rs|ts|tsx|js|jsx|mjs|cjs|md|json|toml|sql|sh|ya?ml|css|html|py|txt|lock|csv|ps1|wxs)`?:[0-9]+|`:[0-9]+|#L[0-9]+'
K='(TanStack Router|@tanstack/[a-z-]+|happy-dom|tauri-plugin-dialog) [0-9]+\.[0-9]+\.[0-9]+|`[0-9a-f]{8}` の時点で|^[^:]+:[0-9]+:\| 20[0-9]{2}-[0-9]{2}-[0-9]{2} \|'
```

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0。
- AC2: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-20-docs-file-line-rewrite.md` が exit 0。
- AC3: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0（function-design を触る。REQ の参照は増減させない）。
- AC-S1-1（正本に行番号が残らない）: `rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' -g '!docs/ci.md' -g '!docs/agent-guidance/**' docs AGENTS.md CLAUDE.md | rg -v -e "$K"` が何も出さない（後ろの `rg` の exit 1）。
- AC-S1-2（残す行は表の残す行だけ）: AC-S1-1 の前半を `rg -e "$K" | cut -d: -f1,2` に通した出力が 9 行で、分類表の S1-001・S1-015・S1-017・S1-018・S1-019・S1-020・S1-032・S1-041・S1-078（`DOC_STYLE_GUIDE.md` の例、`01-decision-rules.md` の 389・419・420・421・423、`02-component-catalog.md` の変更履歴、`22-mnt-migration.md` の 234、`review-checklist.md` の変更履歴）の行である。
- AC-S1-3（lane 2b へ送る行は変えない）: `rg -n -e "$P" docs/ci.md docs/agent-guidance | cut -d: -f1,2` が `docs/ci.md:29` と `docs/agent-guidance/merge-evidence.md:160` の 2 行（起点と同じ）。
- AC-S2-1（comment に行番号が残らない）: `rg -n -e "$P" -g '!src/lib/invalidation-contract.static.test.ts' src src-tauri/src | rg -v -e "$K"` が何も出さない（後ろの `rg` の exit 1）。
- AC-S2-2: AC-S2-1 の前半を `rg -e "$K" | cut -d: -f1,2` に通した出力が `src/features/products/ProductListPage.scroll-restoration.test.tsx` の 3 行（S2-009〜S2-011）だけ。
- AC-S2-3（bindings）: `cd src-tauri && cargo run --bin generate_bindings` の後、`git status --porcelain -- src/lib/bindings.ts` が何も出さない（S2 で bindings に出る doc comment を直したなら、再生成の差分が commit に入っていて、同じく何も出さない）。
- AC-S2-4: `npm run lint`・`npm run format:check`・`cd src-tauri && cargo fmt --check` がそれぞれ exit 0（comment の行だけを変えたことの確かめ）。
- AC-S3-1（backlog の行番号は全部時点つき）: `rg -n -e "$P" docs/backlog.md | rg -v -e '`[0-9a-f]{8}` の時点で'` が何も出さない（後ろの `rg` の exit 1）。
- AC-S3-2（添えた SHA が main に在る）: `for s in $(rg -o -N '`([0-9a-f]{8})` の時点で' -r '$1' docs/backlog.md | sort -u); do git merge-base --is-ancestor "$s" origin/main || echo "NG $s"; done` が何も出さない。
- AC-S3-3（読んで確かめる）: 分類表の S3 の各行の採った版が、その行に添えた句の SHA と一致し、1 行に別の版の引用があるときは版ごとに句がある。
- AC-S4-1（読んで確かめる）: 処置が「消えた」「曖昧」の行ごとに、理由と処置（引用を外した・言い換えた語と意図の照合の 1 句・backlog に足した句）が書いてある。backlog に足した句は `rg -n '次の docs の lane の候補' docs/backlog.md` の項目の中に在る。
- AC-S5-1: `rg -n '\| 未処置 \|$' docs/plans/2026-10-20-docs-file-line-rewrite.md` が何も出さない（exit 1）。
- AC-S5-2（方法の抜き取り）: Implementation Results に抜き取りの表があり、行は分類表の ID の番号が S1 は 5 の倍数（S1-005〜S1-075 の 15 行）、S2 は 3 の倍数と S2-001（5 行）、S3 は 3 の倍数（S3-003〜S3-030 の 10 行）の計 30 行。処置が残す・lane 2b へ送るの行に当たったら、同じ段の次の ID の行で代える。各行に、候補を引く command（方法の 1）と候補の一覧、採った版〈hit か親〉の `git show {rev}:{path} | sed -n '{範囲}p'` の command、その版の行が属する symbol・節、書き換え先、今の base の `rg -n` の hit がある。reviewer は表から 5 行以上を選び、command を実行して「採った版の行の symbol・節 = 書き換え先」を確かめる。
- AC-S5-3（触る file の範囲）: `git diff --name-only origin/main...HEAD | rg -v -e '^docs/function-design/' -e '^docs/design-system/0[0-2]-' -e '^docs/msi-distribution-runbook\.md$' -e '^docs/backlog\.md$' -e '^docs/Plans\.md$' -e '^docs/plans/2026-10-20-docs-file-line-rewrite\.md$' -e '^src/' -e '^src-tauri/src/'` が何も出さない（後ろの `rg` の exit 1。AC-S2-3 で bindings を再生成したら `src/lib/bindings.ts` もこの範囲に入る）。`bash scripts/ci/classify-changes.sh | rg -x 'workflow=false'` が 1 行を出す。
- AC-S5-4（code は comment だけ）: `git diff origin/main...HEAD -- src src-tauri/src | rg '^[-+]' | rg -v '^(\+\+\+|---)' | rg -v '^[-+]\s*(//|/\*|\*|\{/\*)'` が何も出さない（後ろの `rg` の exit 1。bindings を再生成したときは `src/lib/bindings.ts` の行が出るので、その行が doc comment の JSDoc だけであることを読んで確かめる）。
- AC-S5-5（全引用の照合）: 下の loop を repo root で実行した出力に `NG` で始まる行が無い（`| rg '^NG'` が何も出さない、exit 1）。`NG` は、候補が無い・照合の入力の採った版が候補〈hit と親〉に無い・分類表の同じ ID の行の採った版の欄に無い・その版に target の file が無い、と、型が正本・comment・backlog だけの行で引用の数と照合の入力の行の数が違う、を出す。`--` で始まる行（外部 library・repo 外の資料を含む行）は数を読んで確かめる。Writer は出力の全文を PR の comment に残し（大きければ段ごとに分ける）、Implementation Results にはその link だけを書く。reviewer は出力の `==` の塊を全部、「`*` の版の行 N が引用の文の名指す語の symbol・要素の中にあり、それより古い候補の行 N はそうでない（同じ symbol なら最古が `*`）」で照らし、AC-S5-2 の 30 行で symbol の判断を確かめる。

```sh
F=docs/plans/2026-10-20-docs-file-line-rewrite.md
sed -n '/^```text 照合の入力$/,/^```$/p' "$F" | rg -v '^(```|#)' | while read -r id rev target n x; do
  re="$(printf '%s' "$x" | sed 's/[][\\.*^$+?(){}|]/\\&/g')([^0-9]|\$)"
  a=${n%-*}; b=${n#*-}
  hits=$(git log --format=%H --pickaxe-regex -S"$re" origin/main)
  cands=$(printf '%s\n' "$hits" | rg . | while read -r h; do git rev-parse "$h" "$h^@"; done | sort -u)
  full=$(git rev-parse -q --verify "$rev^{commit}")
  echo "== $id X=$x target=$target:$n rev=$rev"
  [ -n "$hits" ] || echo "NG $id: 候補が無い"
  printf '%s\n' "$cands" | rg . | xargs -r git show -s --format='%ct %H %ad' --date=short | sort -n | while read -r t c d; do
    printf '%s\n' "$hits" | rg -qx "$c" && k=hit || k=親
    [ "$c" = "$full" ] && m='*' || m=' '
    echo "  $m $(printf %.8s "$c") $k $d | $(git show "$c:$target" 2>/dev/null | sed -n "${a}p")"
  done
  [ "$rev" = - ] && continue
  printf '%s\n' "$cands" | rg -qx "$full" || echo "NG $id: $rev が候補に無い"
  rg -q "^\| $id \|.*\`$rev\`" "$F" || echo "NG $id: 分類表の採った版に $rev が無い"
  git cat-file -e "$rev:$target" 2>/dev/null || echo "NG $id: $rev に $target が無い"
  git show "$rev:$target" 2>/dev/null | sed -n "${a},${b}p" | sed "s/^/    $a-$b | /"
done
rg '^\| S[1-3]-[0-9]{3} \|' "$F" | while IFS='|' read -r z id loc cites type rv dest act z2; do
  id=${id// /}; type=${type# }; type=${type% }
  case "$act" in *残す*|*'lane 2b'*) continue;; esac
  nc=$(printf '%s' "$cites" | rg -o '`[^`]+`' | wc -l)
  nb=$(sed -n '/^```text 照合の入力$/,/^```$/p' "$F" | rg -c "^$id ")
  case "$type" in 正本|comment|backlog) [ "$nc" -eq "${nb:-0}" ] || echo "NG $id: 引用 $nc / 照合の入力 ${nb:-0}";;
    *) echo "-- $id（$type）: 引用 $nc / 照合の入力 ${nb:-0}（読んで確かめる）";; esac
done
```

baseline（起点 `6a25f63f`、2026-10-20。上の変数を定義して各 command を逐語で実行した。`wc -l` は数を見るために付けた。`# exit` は pipe の最後の command の終了値。AC1〜AC3・AC-S2-3・AC-S2-4 は PR の Validation の欄。AC-S5-1 は起票の時点で S1〜S3 の表の 117 行が未処置〈起票の時点で処置を決めた 6 行を除く〉）:

```text
$ git rev-parse --short HEAD
6a25f63f
# exit=0

$ rg -o -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' docs AGENTS.md CLAUDE.md | wc -l
451
# exit=0

$ rg -o -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' docs AGENTS.md CLAUDE.md | wc -l
230
# exit=0

$ rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' docs AGENTS.md CLAUDE.md | wc -l
78
# exit=0

$ rg -o -e "$P" docs/backlog.md | wc -l
82
# exit=0

$ rg -n -e "$P" docs/backlog.md | wc -l
31
# exit=0

$ rg -o -e "$P" docs/decision-log.md | wc -l
4
# exit=0

$ rg -o -e "$P" docs/design-system/reference | wc -l
135
# exit=0

$ rg -o -e "$P" -g '!src/lib/invalidation-contract.static.test.ts' src src-tauri/src | wc -l
14
# exit=0

$ rg -o -e "$P" src/lib/invalidation-contract.static.test.ts | wc -l
11
# exit=0

$ rg -c -e "$P" .agents .claude/rules .claude/commands .claude/agents README.md .github scripts
(出力なし)
# exit=1

## AC-S1-1
$ rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' -g '!docs/ci.md' -g '!docs/agent-guidance/**' docs AGENTS.md CLAUDE.md | rg -v -e "$K" | wc -l
72
# exit=0

## AC-S1-2
$ rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' -g '!docs/ci.md' -g '!docs/agent-guidance/**' docs AGENTS.md CLAUDE.md | rg -e "$K" | cut -d: -f1,2
docs/DOC_STYLE_GUIDE.md:87
docs/design-system/02-component-catalog.md:1063
docs/design-system/01-decision-rules.md:389
docs/quality/review-checklist.md:123
# exit=0

## AC-S1-3
$ rg -n -e "$P" docs/ci.md docs/agent-guidance | cut -d: -f1,2
docs/ci.md:29
docs/agent-guidance/merge-evidence.md:160
# exit=0

## AC-S2-1
$ rg -n -e "$P" -g '!src/lib/invalidation-contract.static.test.ts' src src-tauri/src | rg -v -e "$K" | wc -l
14
# exit=0

## AC-S2-2
$ rg -n -e "$P" -g '!src/lib/invalidation-contract.static.test.ts' src src-tauri/src | rg -e "$K" | cut -d: -f1,2
(出力なし)
# exit=0

## AC-S3-1
$ rg -n -e "$P" docs/backlog.md | rg -v -e '`[0-9a-f]{8}` の時点で' | wc -l
31
# exit=0

## AC-S3-2
$ for s in $(rg -o -N '`([0-9a-f]{8})` の時点で' -r '$1' docs/backlog.md | sort -u); do git merge-base --is-ancestor "$s" origin/main || echo "NG $s"; done
(出力なし)
# exit=0

## AC-S5-5（round 1 の是正で足した。照合の入力が空の本 packet で、上の loop を bash と zsh で実行。出力は同じ）
$ { AC-S5-5 の loop; } | rg -c '^NG'
108
# exit=0

$ { AC-S5-5 の loop; } | rg -c '^--'
9
# exit=0
```

完了の時点の期待: AC-S1-1・AC-S2-1・AC-S3-1 は 0 行（後ろの `rg` の exit 1）、AC-S1-2 は 9 行、AC-S2-2 は 3 行、AC-S1-3 は起点と同じ 2 行、AC-S3-2 は出力なし、AC-S5-5 は `NG` の行なし（起票の時点の 108 は、型が正本・comment・backlog だけで未処置の行〈S1 66・S2 11・S3 31〉の数の食い違い。`--` の 9 は S1-014・S1-017〜S1-020・S1-041・S2-009〜S2-011）。

## Design Readiness

- 引用する設計正本（節まで）: [DOC_STYLE_GUIDE](../DOC_STYLE_GUIDE.md) §1「code と文書の箇所の引き方（行番号で引かない）」、[decision-log](../decision-log.md) の D-125（Decision の (1)〜(3)、Guarantee range）、[DEV_WORKFLOW](../DEV_WORKFLOW.md) Workflow State の `Final Review Minimum`（workflow gate の変更は 2）と Wave Operation（base の同期）、`scripts/ci/classify-changes.sh` の workflow の path の一覧。
- 必要な設計成果物: Design artifact selection の当たる行は無い（振舞い・command・DB・画面・format を変えない）。状態は existing sufficient。
- plan にしかない durable な判断の昇格先: 本 packet が決める判断は 3 つ。(1) 書かれた時点の意図の取り戻し方（`git log -S` の全 hit と親を候補に古い順に歩き、引用の文が名指す語の symbol の中に行 N がある最古の版を採る）、(2) 外部 library の引用は版を同じ行に書いて行番号を残す、(3) workflow の 2 件を lane 2b へ送る。(1) は書き換えの手順で、規則でない（D-125 の文は変えない）。(2) は DOC_STYLE_GUIDE §1 の「library の版を書いた観測はそのまま」の当てはめ。(3) は lane の範囲の分け方。どれも lane 2b が検査を足すときに、2b の packet が検査の形として引き継ぐ（D-125 の Revisit「lane 2 が検査を足すとき」）。
- 前提・制約と延期した gap: workflow の 2 件は lane 2b へ延期する。延期しても安全な理由: 2 件は今も指す先が合っている（起点の調査の抜き取りで `docs/ci.md:29` と `merge-evidence.md:160` は「合う」）うえ、2b は検査を入れる前に直す。
- 絶対保証の自己点検: 「正本と comment に行番号が残らない」は AC-S1-1・AC-S2-1 の `P` の 3 つの形についての主張。`P` の拡張子の一覧の外の形（例 `.rb:N`）と、行番号を文で書く形（「65 行」）は対象外（D-125 の 3 つの形と同じ範囲）。
- 判定: ready。

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| Tauri command・specta の型の doc comment | `cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成 | 起票の時点で当たる comment は無い（S2-001 は `#[cfg(test)]` の module の `pub(crate) fn`）。AC-S2-3 で確かめ、当たれば S2 の同じ commit で再生成する |
| REQ / coverage の追加・変更・削除 | `cargo run --bin generate_traceability` で 90 を再生成 | REQ の参照は増減させない。AC3 の `--check` で確かめ、増減が出たら再生成して Scope に足す |
| function-design doc の節 | `design_compliance_test` の必須節 | 節の見出しを足さず消さない（引用の文だけ） |

ほかの行（route、operator 画面、source / workflow doc の新設）は該当なし。

## Impact Review Lenses

not applicable: 起点は現地調査・実機確認・外部 tool の振舞いでなく、repo の中の docs と code の引用の照合（read-only の調査 1 本と git の履歴）。外部 library の行は版を書いた観測として残し、今の版で確かめ直さない（非目的）。

## Boundary / Wire Contract

変えない。JSON・CSV・config・manifest・DTO・DB に触れない。bindings は doc comment が当たるときだけ再生成し、型は変わらない（AC-S2-3）。

## Test Plan

Test Design Matrix は置かない（R2 で任意。各段の AC が `rg` の件数と分類表の行で、書き換えた所と残した所を確かめる）。

- targeted tests: AC3（`generate_traceability -- --check`）、AC-S2-3（bindings の再生成の差分なし）、AC-S2-4（lint・format・`cargo fmt`）。comment だけなので test は足さない（hosted CI の rust・frontend の job が既存の test を回す）。
- negative tests: AC-S1-1・AC-S2-1・AC-S3-1（行番号の引用が残らない）、AC-S5-4（code は comment の行だけ）、AC-S5-3（時点の記録と workflow の file を触らない）。
- compatibility checks: AC1・AC2（Markdown の link の先の file の実在）。
- data safety checks: AC-S5-3 の範囲と、書き換えた文に店の運用の細部・実値・発言の原文・金額・商品名を足していないこと（引用を symbol・節に替えるだけ）。
- main wiring/integration checks: AC-S5-5（全引用の候補と採った版の行を loop で照らす）と AC-S5-2（symbol の判断の抜き取りを reviewer が `git show` で再現できる）。

起票の run の検証（AC1・AC2 と `bash scripts/check-workflow-git.sh`）の結果は PR の Validation の欄に書く。

## Review Focus

- 方法: 候補（path で絞らない `--pickaxe-regex -S` の全 hit と親）を古い順に歩き、引用の文が名指す語の symbol の中に行 N がある最古の版を採る照合で、書かれた時点の意図を取り戻せるか。照合で合わない引用を「消えた・曖昧」に落とす条件が緩すぎないか（今の行を見て付け替える逃げ道が無いか）。
- AC: AC-S1-1・AC-S2-1・AC-S3-1 の `K` の除外が、残す行の形だけを外し、書き換え漏れを隠さないか（AC-S1-2・AC-S2-2 の行の数と ID で照らす）。
- 分類表: 起票の時点で処置を決めた 6 行と、型を決めた行（外部 library・repo 外の資料）の当否。
- Q1（Plan Review で答える）: workflow の 2 件（`docs/ci.md:29`・`docs/agent-guidance/merge-evidence.md:160`）を lane 2b へ送るか、本 lane で直して Final Review Minimum を 2 にするか。既定: 2b へ送る（発注の Final Review Minimum 1 と、workflow の file を触ると 2 を求める規則〈DEV_WORKFLOW Workflow State・helper〉を両立する。2b は元から Double Audit）。
- Q2（Plan Review で答える）: 外部 library の引用（正本 6 行・comment 3 行）は、版を同じ行に書いて行番号を残すか、library の symbol（関数名）で引き直すか。既定: 版を書いて残す（DOC_STYLE_GUIDE §1 の版を書いた観測の形。library の中の関数名は版で変わり、行番号と同じく版に依る）。
- Q3（D-127、Plan Review で答える）: この変更で不要になる記述・条件は無いか。起草の答え: 規則の文・検査は本 lane で変えない。起点の調査の提案のうち「reference の file の頭に時点の注記を足す」は DOC_STYLE_GUIDE §1 の「そのまま残す」と重なるので採らない（非目的）。backlog の「次の docs の lane の候補」の項目に file:行 の引用を扱う句は無い（`rg -n '行番号|file:行' docs/backlog.md` が何も出さない）。`docs/Plans.md` の `## 次の行動` の lane 2 の文は、本 lane の merge の後の closeout で 2b だけの文に替える。

## Implementation Results

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

実装の run が埋める: 段ごとの結果、計画からの外れ、AC-S5-2 の抜き取りの表（30 行。列: ID・引用・候補を引く command と候補の一覧・採った版〈hit か親〉と `git show` の command・その版の行の symbol・節・書き換え先・今の base の `rg -n` の hit）、AC-S5-5 の loop の出力を置いた PR の comment の link。

## Review Response

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。

### Plan Review round 1（監査 `4e4bc1ce`）

- Codex（発注 460）: approve、P3 1。
- Claude 側（fresh Opus 5.5、fork でない）: reject、P2 2 / P3 2。
- 相談役（Fable 5.1、fresh、read-only）の反例探しを是正に使った。分類表の全 326 引用に候補の出し方 4 通りを機械で当て、F1 の代わりの形（候補の集合を古い順に歩く）と AC の追加を出した。相談の run は review の数に入らない。
- 裁定: Coordinator が全 finding を受理。

| # | 出所 | 重大度 | 指摘 | 直した所 |
|---|---|---|---|---|
| F1 | Opus | P2 | C を「path で絞らない `-S` の最も古い commit」とする定義が、別の文書の同じ file:N（S1-028 `StockStatusBadge.tsx:36`〈最古 `2f8a6f61`、正しい版 `f2ef9e52`〉・S1-016・S1-031）と前方一致（S1-045 `lib.rs:118` → `lib.rs:1188`）で誤った版を採り、±3 行の窓の照合が誤りを通す | Scope「書き換えの方法」の 1・2 を置き換えた: 候補 = path で絞らない `--pickaxe-regex -S'<X>([^0-9]\|$)'` の全 hit と親を古い順に、名指す語を含む symbol・要素の中に行 N がある最古の候補を採る。path で絞る・最古の 1 つを採る・長い文字列・`-L`・`git blame` を使わない理由を実例 1 つずつで書いた。手順の試し 2 件・分類表の凡例（hit か親か）・AC-S5-2・Design Readiness (1)・Review Focus の方法・Implementation Results の約束を同じ語に揃えた |
| F2 | Opus | P2 | root `902647b8` が C になる 10 行で `C^` が無く手順 2 が定義されない。S4 の最小の言い換えの根拠が定まらず、今の行（`sales_service.rs:196` の `pub count: usize`）から付け替える道が残る | 手順 6 に「root だけが候補で合わない行」を含めて S4 へ送ると書いた（root の特例の条項は置かない）。S4「最小の言い換え」の根拠を、引用の文自身が名指す語と、それが今どの symbol にあるかに限り、今の行 N の中身を根拠にしないと書いた |
| F3 | Opus | P3 | 行に path が無い bare の `` `:N` `` の target の決め方が無い | 手順 1 の末尾に、target を同じ節の直前の path（無ければ文書の対象 module）とし根拠を処置の欄に書くと足した。手順 5 の正本の形に、symbol が隣にあれば採った版でその symbol が行 N を含むと確かめて `:N` だけを外すと足した |
| F4 | Opus | P3 | backlog の句の `{path}` が basename か repo root からの path か書かれていない | 手順 5 の backlog の形に「`{path}` は repo root からの path」を足した |
| C1 | Codex | P3 | 試し 2 の `price_range_error` の定義の行は 949（948 は doc comment） | 手順 1〜2 の試しを 949 行に直した（新しい手順で当て直し、親 `67870e10` が合わず hit `6cac578c` を採ると書いた） |
| AC | 相談役の提案（Coordinator が受理） | — | 抜き取り 30 行だけでは方法の誤りを拾えない | S5 に全引用の照合の evidence の段、分類表の後に「照合の入力」の block、AC-S5-5（block を読み、候補と各候補の行 N、採った版の行を出し、機械で分かる食い違いを `NG` にする loop）を足した。出力は PR の comment に置き、Implementation Results には link だけ（D-038） |

あわせて直した所: 手順 5 の library の形に、版を引いている package の版で書く 1 句（Opus の Q2 の補足）。手順 5 の正本の形に、`b2389b19` 起源のような時点の句を引き直しの後に残すかを処置の欄で判じる 1 句（Opus の Q3 の補足）。置き換えた手順の旧い文（最も古い commit を C とする・C と C^ の照合）は、この節の指摘の引用の他に残していない。
