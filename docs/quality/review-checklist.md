# 設計書レビューチェックリスト

> 設計書PRのレビュー時に使用する。9カテゴリと設計判断レンズを固定観点とする。観点の後出し追加を防ぐ。

## 運用ルール

1. **レビュー前**: `./scripts/doc-consistency-check.sh` を実行し、機械検出可能な不整合をゼロにする
2. **レビュー時**: 下記9カテゴリと設計判断レンズのみを観点とする。カテゴリ外の指摘は「次回の観点候補」としてメモし、今回は対象外
3. **返却時**: 各カテゴリで最大3件。「今回の観点外」を明示して返す
4. **GitHub投稿**: GitHub PRレビュー依頼は、ユーザーが止めない限り、findingsを該当PRへコメント投稿するところまで含める
5. **投稿境界**: PRレビュー依頼で許可されるのはレビュー本文・コメント投稿のみ。labels / review-thread resolve / merge / close 等は別途明示許可を必要とする
6. **再レビュー**: 前回指摘の修正確認のみ。新規観点の追加は禁止（新規は次PRで）

## 9カテゴリ

### 1. 型・契約の整合

- [ ] 関数シグネチャの引数型・戻り値型が、呼び出し元と一致しているか
- [ ] 構造体の定義（フィールド名・型）が、使用箇所と一致しているか
- [ ] エラー型の変換経路が正しいか（IO→BIZ→CMD の各層で適切な変換）

### 2. 責務境界

- [ ] IO層がBizError/CmdErrorを参照していないか
- [ ] CMD層がDbErrorを参照していないか
- [ ] BIZ層がキャッシュやAppStateを直接操作していないか
- [ ] CMD層が業務ロジック（バリデーション以外）を持っていないか

### 3. TX境界・データ整合

- [ ] operation_log の TX 境界が設計正本と一致しているか（既定 = TX外 best-effort〈旧・第4段階先決事項D-6〉。source design が明記する例外 = BIZ-01 商品更新系 / BIZ-02 業務記録系 / BIZ-07 fix_integrity〈D-051〉は TX内必須）
- [ ] TX範囲が明示されているか（開始・コミット・ロールバック）
- [ ] 同日別hashの追加取込みがinsert-onlyで、同一hash再検査とactive same-date snapshot再検証が同一TX内か
- [ ] TOCTOU防止（TX内の再チェック）が必要な箇所に入っているか

### 4. エラーハンドリング

- [ ] 各エラーパスのBizErrorバリアント/メッセージが設計書と一致しているか
- [ ] ログ記録失敗時の方針（「警告のみ」等）が明記されているか
- [ ] 冪等性の方針が明記されているか（2回目呼出し時の挙動）

### 5. 用語・命名

- [ ] CSV / PLUファイル の使い分けが正しいか（PLU関連=CV17向け `.txt` タブ区切り、Z004関連=CSV）
- [ ] 関数名が設計書間で一致しているか（_for_plu等のサフィックス）
- [ ] 定数がリテラル直書きではなく constants:: 参照か

### 6. 入出力例・手順

- [ ] 処理ステップの番号が連番か（欠番なし）
- [ ] 入力例・出力例が型定義と一致しているか
- [ ] ローカル変数の導出が明示されているか（未定義変数の参照なし）

### 7. 防御・境界値

- [ ] LIMIT に ORDER BY が付いているか
- [ ] ページングに per_page 上限があるか
- [ ] ファイルサイズ・行数の上限チェックがあるか
- [ ] ロック取得パターンが方針と一致しているか（同時保持しない）

### 8. 設計-コード整合

- [ ] 関数シグネチャを変更した場合、対応する設計書も更新したか
- [ ] 新規 pub 関数を追加した場合、設計書に記載があるか（なければ allowlist に追加理由を明記）
- [ ] `cargo test --test design_compliance_test` を PR 提出前に実行したか
- [ ] テスト・設計書・REQ インベントリを変更した場合、`cd src-tauri && cargo run --bin generate_traceability -- --check` が green か（drift 時は再生成して commit）

### 9. Operator UI visibility

- [ ] 既存画面の共通レイアウト、spacing、typography、色トークン、テーブル / カード / チップ表現を継承しており、ページごとに別アプリのような見た目になっていないか（DSR-01）
- [ ] 業務ステータスが色だけで符号化されていないか（日本語ラベル + アイコン / 形 / 位置 / バッジ / 状態列などの非色シグナルがあるか）（DSR-08）
- [ ] 非IT系・高齢利用者が通常距離で主要テキスト、数値、状態を読める設計か（DSR-13）
- [ ] `在庫切れ` / `在庫少` / `商品コード` / `売上明細数` などの表示文言が業務上の意味と一致しているか（DSR-11）
- [ ] テーブル、カード、チップの密度・幅・truncate が主要値の理解を壊していないか（DSR-12）
- [ ] keyboard focus、active state、filter selection が色以外でも判別できるか（DSR-02）
- [ ] 現在地と選択状態の色分離が DSR-21 に従い、主ナビゲーションの現在地だけに Primary アクセントを重ね、filter chip / SegmentedControl は stone のままか
- [ ] 状態を変える control は、変更後も到達可能で、元に戻す / 別状態へ移る recovery path が残っているか（例: 表示拡大後に表示サイズ control へ戻れる）（DSR-07）
- [ ] Select / filter の候補を現在の filtered result から派生していないか。派生する場合、選択後に候補が現在値だけへ縮退せず、他候補へ直接切り替えられるか（DSR-10）
- [ ] 明細行を持つフォームでは、行の追加 / 編集 / 削除 / 再追加後に validation error が stale 表示されないか。変更・削除された行のエラーだけ消え、未変更行のエラーは残るか（DSR-07）
- [ ] operator-facing UI flow / status の変更で Windows native L3 が必要か、必要なら Plan / PR evidence に記録されているか（DSR-08）
- [ ] 同型情報（複数件の同じ形のレコード）の表示形式が DSR-16 の判断フロー（比較目的 = 列を揃えた表・structured list / レコード固有操作あり = 一意見出しの summary card / 単一レコード確認 = definition list）に適合するか。囲み（border/カード）を比較目的の反復で唯一のグループ信号にしていないか
- [ ] 画面遷移 scroll が DSR-17 の 3+1 分類（同一画面内の状態遷移 = event-driven 先頭 scroll / 一覧→詳細→戻り = 位置復元が本則 / Home 帰着 one-shot = flag 消費時のみの条件付き先頭 scroll / 主ナビゲーション操作 = 復元 cache より優先して遷移先先頭）に沿っているか。主ナビの発火契機を route component の mount と混同せず、無条件の mount 一律 scroll を導入していないか。UI-11b-D12 の negative 契約を router の遷移時位置決めへ広げていないか
- [ ] 「前の画面へ戻る」導線が DSR-18 に従い、業務記録詳細への link は search state を含む遷移元 URL を `returnTo` として送っているか。欠落・不正時は遷移先ごとの既定 hub へ fallback し、共通 helper は DSR-15 の prefix 検証を下回っていないか
- [ ] 作成・保存成功の feedback が DSR-19 に従い、同じ作業文脈へ戻る flow では toast を最低保証し、確認・継続操作がある場合は result panel、専用 result step / 結果画面では持続的結果表示を使い分けているか。duration の 3s / 5s / 8s 階層と、重複し得る通知だけに適用する toast id の範囲が適切か
- [ ] destructive 確認 dialog が DSR-20 に従い、Action は `variant="destructive"`、DOM 順は Cancel → Action、`sm` 以上は Cancel 左 / Action 右、narrow は Action 上 / Cancel 下になっているか。Esc / 外側クリックは cancel ブリッジを本則とし、硬化時は適用条件を満たして明示 prop を使い、Cancel 文言から後状態を判別できるか
- [ ] 一覧の器（toolbar 2 段・上下の件数と現在位置・sticky header・識別列 opt-in）と現在の行（左端バー + 淡い背景 + badge/文言の 3 点）、UI 部品の枠（操作枠 3:1 / 構造線を一段濃く）が DSR-22 に従っているか。同型情報のグループ化（DSR-16）・現在地の色分離（DSR-21）と主題を混同していないか

## 設計判断レンズ（model-neutral 必須観点）

1. Layer: UI→CMD→BIZ→IO 一方向か。CMD に業務ルールが増えていないか。architecture_test の例外 allowlist を増やす変更は理由を doc に書いたか。
2. POS boundary: CASIO 語彙（Z00x/CV17/SR-S4000/CP932）が BIZ/CMD/UI の契約に新規混入していないか。機械ガードなし、レビューが最後の砦。混入が正当なら design doc に理由を書く（UI-07-D9 前例）。
3. Vendor literal: `casio_sr_s4000` 等のベンダー識別子を新たに埋め込むなら、既存の分散点を増やさず定数 / adapter 側へ。
4. Operator: 非IT高齢オーナーが単独で完遂できるか。失敗時に画面が次の手を告げるか。色のみの状態符号化は禁止。
5. Manual gate: アプリが自動確認できない外部反映（PCツール/SD/レジ）を「確認済み」と偽装する UI 文言になっていないか（D-027 原則）。
6. Data safety: 復元・削除・rollback は取り返しがつくか。物理削除ではなく状態遷移か（D-6 原則）。実データ・JAN・価格を fixture / docs / PR に入れていないか。
7. CSV/report semantics: `daily_report_*`（公式日報）と `sale_records`（商品別正本）を混ぜていないか。日報を `sale_records` / `inventory_movements` へ擬似展開していないか（D-025）。
8. Rollback 非対称: `csv_import` = 物理 void / `daily_report` = 論理取消。新しい取込みを作るならどちらの semantics か明示したか。
9. Idempotency: 書き込み系に冪等キーはあるか（migration v2 契約）。
10. Docs vs Plan Packet: durable な判断を Plan Packet に置き逃げしていないか。昇格先は decision-log / function-design / DB_DESIGN。
11. REQ/test trace: REQ 番号がテスト名にあるか。traceability check が green か。
12. Fixture 信頼: adapter 系は synthetic fixture green を信じず実サンプル local gate を AC に（PR #125 の教訓）。

## 観点外（次回以降の候補として蓄積）

このセクションに、レビュー中に気づいた「今回のカテゴリに含まれないが将来対応すべき指摘」をメモする。次PRの観点追加候補として管理する。

- （なし）

---

## 更新履歴

| 日付 | PR | 内容 |
|---|---|---|
| 2026-09-03 | 本 PR | カテゴリ 9 に DSR-22（一覧の器・現在行・UI 部品枠のコントラスト）対応行を追加。 |
| 2026-08-16 | PR #79 | D-071 / SPEC-SDI-D4: TXレビュー観点を同日追加のinsert-only + snapshot再検証へ更新。 |
