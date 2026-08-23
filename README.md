# 在庫管理システム

個人経営の手芸店向けに、日々の在庫・売上・商品管理を支援する Windows デスクトップアプリです。

## 概要

CASIO レジのファイル出力と連携しながら、商品マスタ、入出庫、棚卸し、売上レポートを一つのアプリで管理します。非 IT の店舗運営者が日常的に使うことを前提とし、データはローカルの SQLite に保存して外部へ送信しません。

## 主な機能

- 商品の検索・一覧表示・登録・修正
- 入庫、返品・交換、手動販売出庫、廃棄・破損の記録
- 在庫照会、入出庫履歴、商品別の在庫変動追跡
- 棚卸しの開始、カウント、確定、前回結果との比較
- POS レジ連携による売上データ取込みと PLU ファイル書出し
- 日次・月次の売上レポート
- 取引先や部門で絞り込める一括価格改定
- 商品マスタの CSV 一括インポート
- バックアップ・復元、在庫少の基準設定、操作ログ、在庫整合性検証

機能名と画面構成の根拠は、[画面一覧と使用頻度](docs/SCREEN_DESIGN.md#1-画面一覧と使用頻度)および[関数設計書の対象モジュール](docs/FUNCTION_DESIGN.md#現時点の対象モジュール)を参照してください。

## 技術構成

- デスクトップ基盤: Tauri 2 / Rust
- フロントエンド: React 19 / TypeScript / Vite
- データベース: SQLite（rusqlite）
- テスト: `cargo test` / Vitest / React Testing Library

## 設計書

- [アーキテクチャ設計](docs/ARCHITECTURE.md)
- [データベース設計](docs/DB_DESIGN.md)
- [関数設計](docs/FUNCTION_DESIGN.md)
- [画面設計](docs/SCREEN_DESIGN.md)
- [デザインシステム](docs/design-system/README.md)

## 開発の進め方

作業時の基本ルールは [AGENTS.md](AGENTS.md)、開発フローと検証手順は [docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md) を参照してください。

## ビルドと起動

前提環境は Rust 1.83 以降と Node.js 24 系です。詳細は [開発環境セットアップチェックリスト](docs/DEV_SETUP_CHECKLIST.md)を参照してください。

```bash
npm ci --ignore-scripts
npm run tauri dev
```

依存関係の導入時に install script は実行しません。

## 公開とライセンス

閲覧用に公開しています。All rights reserved — コードの再利用・再配布は許諾していません。
