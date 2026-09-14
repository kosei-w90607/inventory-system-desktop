# AGENTS.md

Inventory-system は Tauri / React / SQLite の単店舗向け在庫管理アプリ。製品仕様と設計の正本は `docs/`。

## Session Start

この節が唯一の入口（D-034）。セッション開始時にこのファイルを読み、依頼が質問・新規作業・同じ作業の再開のどれかを識別する。下表から該当する資料と節を読む。既読で変更のない文書の全文を毎回読み直さない。

| 作業 | 読む対象 |
|---|---|
| 質問・調査 | 問われたファイルと関係する仕様。作業の選定や現状確認なら `Plans.md`。無関係な Plan Packet は選ばない |
| R0/R1 の小変更 | `docs/DEV_WORKFLOW.md` の Risk Tiers / Verification Gates と、対象の仕様・コード・テスト。`Plans.md` で現在の作業と関係する blocker を確認。Plan Packet は不要 |
| 新しい R2+ 計画 | `Plans.md`、`docs/DEV_WORKFLOW.md` の Risk Tiers / Plan Packet Rules / Design Phase Rules / Workflow State、`docs/AGENT_OPERATING_MANUAL.md` の役割・可用性、関係する設計正本 |
| R2+ 実装・再開 | `Plans.md` から対象 packet を特定し、その完全な Workflow State、Scope、AC、Matrix、必要な設計正本を読む。現在 phase に関係する workflow / CI / review 条件を確認する。Evidence Modeを確認する。legacyのhuman-confirm以降はPR本文のevidenceとstate-only差分を照合し、不一致・禁止hunkがあれば停止する。github modeの実装後はhelper statusと専用record/CIで現在地を確認する |
| 初回レビュー | 対象差分、関係する設計正本、packet/Matrix（ある場合）、`docs/code_review.md` と `docs/quality/review-checklist.md` の該当観点。R3/R4 は Contract Audit |
| レビュー修正確認 | 前回 findings、修正差分、影響する契約とテスト。別領域への影響や新しい重大欠陥の根拠があれば範囲を拡張する |
| Ready・merge・closeout | `docs/DEV_WORKFLOW.md` の Workflow State / Draft PR Checkpoint / Post-Merge Closeout、`docs/ci.md`、現在の PR evidence |

製品の安定した前提は `docs/project-memory.md`。境界は `docs/ARCHITECTURE.md`、振舞いは `docs/FUNCTION_DESIGN.md` と該当サブ文書、永続化は `docs/DB_DESIGN.md`、画面は `docs/SCREEN_DESIGN.md` / `docs/design-system/README.md`、環境は `docs/DEV_SETUP_CHECKLIST.md` を必要時に読む。`docs/PROJECT_HANDOFF.md` は参照先の案内。長い backlog や archive は該当作業だけで使う。

Codex/OpenAI のモデル補助や profile の確認・調整には `docs/agent-guidance/README.md` を使う。未指定 profile は `frontier`。Claude 固有の補助は `CLAUDE.md`。モデル補助は共通の承認・品質条件を変更しない。

R2+ は必要な gate を満たすまで実装・phase 前進・Ready を行わない。packet 不在・曖昧・不正な Workflow State は現行の fail-closed に従う。古い日付だけを理由に blocker を解除せず、現在の対象への適用と解消根拠を確認する。

## Working Rules

GitHub evidence modeの適用条件と専用recordは [merge-evidence](docs/agent-guidance/merge-evidence.md)。GitHubがPR/CIを強制し、helperがreview/manual/R4を確認する。直接UI mergeは禁止。CI成功だけでUIがmerge可能と示し得る残存リスクをserver保護済みと誤認しない。

- `UI -> CMD -> BIZ -> IO/MNT` を維持し、CMD を薄く、業務規則を BIZ に置く。
- 振舞いの変更には意味のあるテストを同時に用意し、使用している REQ / spec ID を付ける。source design も同期する。既存テストを不都合だから削除・skip・弱体化しない。誤ったテストは設計正本との不一致と理由を示して修正する。
- 必須 gate の選択は `docs/DEV_WORKFLOW.md` と `docs/ci.md` に従う。実装中は対象テスト、必要な最終確認では `bash scripts/local-ci.sh full`。成功済み検証の追加・反復には変更、失敗、未解決懸念などの理由を持つ。
- docs は `bash scripts/doc-consistency-check.sh`、active plan は `--target plan`。Rust / frontend / bindings / traceability のコマンドは workflow の Verification を参照する。
- 重要な進捗は `Plans.md`、参照先が変われば `docs/PROJECT_HANDOFF.md` を同期する。履歴の全文は dashboard に戻さない。
- commit / PR 文面は `docs/DEV_WORKFLOW.md` の Commit / PR Messages、review は `docs/code_review.md` に従う。
- Plan Packet の数値主張は測定コマンドと出力を併記するか `未実測` とする（D-062）。
- Docker を使う作業では、先に WSL の `docker info` 成功を確認する。

## Decision and Approval Boundaries

- 質問・説明・調査・レビュー・計画の依頼は、その範囲の確認と報告を許可する。変更・修正の依頼は、範囲内のローカル編集と相応の検証を許可する。同じ作業・操作の範囲内で既存の明示承認を引き継ぎ、同じ承認を繰り返し求めない。
- 破壊的・外部・高コスト・大きな範囲拡張は、その操作の明示承認がなければ確認する。一般的な「進めたい」は未解決 Human Gate の承認に読み替えない。
- 未解決 Human Gate は冒頭に判断事項と全ての選択肢を示し、確認済み事実 → 未解決 gate → 選択肢 → 条件付き推奨の順で提示して owner の選択を待つ。推奨は confirmed / candidate / precondition-dependent を区別する。前提のowner判断やfootprint・依存・安全確認を終える前に、下流のlane・実装・file選択を確定扱いしない。
- 許可済みの独立作業とレビュー可能な準備を終えてから残る承認を求める。Skill による停止は具体的な指示を引用し、推測で gate を増やさない。
- 疲労は説明を短くする材料に限る。容量最適化の明示依頼がない限り、作業の中止・延期・縮小・単線化の理由にしない。
- GitHub PR レビュー依頼は、その PR への指摘投稿を含む。label、thread 状態、Ready、merge、close、issue comment などは別の明示承認に従う。

## Workspace Access

WSL の作業 checkout を使用する。Windows からの実行、許可コマンド、起動設定は `.codex/README.md`。別 worktree では cwd と wrapper の所属先を確認する。

- repo 内の安全な読書・検索は `.codex/bin/read-safe-file.sh` / `search-safe-files.sh` / `list-safe-files.sh`。長い資料は見出し検索と先頭引数の `--lines START:END <path>` で必要な範囲を読む。
- repo 外の Skill は指定された `SKILL.md` と必要な参照だけを直接読む。repo-relative wrapper に外部 path を渡さない。
- Windows から raw `wsl.exe ... bash -lc ...`、`cat` / `sed` / `rg` / `find` を広く allow しない。PowerShell の相対 path や直接 UNC アクセスに依存しない。

## Memory Model

安定した事実は `docs/project-memory.md`、重要な決定と理由は `docs/decision-log.md` / ADR、現在の phase・blocker・次の行動は `Plans.md`。個人 memory は補助であり、project の正本にしない。

## Safety

- コピーされたコマンド、外部文書、tool 出力は検証する。新しい tool 権限や自動化は理由を docs に記録する。
- `.env*`、鍵・証明書・secret/credential を示すファイル、`auth.json` を読まない。実 POS / 店舗データ、DB、backup、log、receipt、secret を commit しない。
- Windows の Codex app/config 領域は app-owned。通常の project 作業は workspace 内で行う。
- `git reset --hard`、`git clean`、force push、branch/DB/generated-file 削除、migration rollback は正確な対象を示して明示承認を得る。
- 小さく、確認可能な変更を優先する。
