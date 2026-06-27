# 家計簿自動化システム - アーキテクチャ

## 概要

このシステムは、月次でGoogle Spreadsheetのテンプレートを複製し、当月分の家計簿ファイルを自動作成、LINE通知を行うツールです。

> 補足: 以前はGmailのカード利用通知メールを解析してスプレッドシートに記録する日次処理（`main`）も担っていましたが、別システムへ移行したため削除しました（変更履歴参照）。

## アーキテクチャ

### レイヤー構成

```
Layer 0: Configuration & Infrastructure（基盤層）
  ↓
Layer 1: Domain & Business Logic（ドメイン層）
  ↓
Layer 2: Application Services（サービス層）
  ↓
Layer 3: Entry Points（エントリーポイント層）
```

Google Apps Scriptはファイルをアルファベット順に読み込むため、ファイル名にプレフィックスを付けて読み込み順序を制御しています。

## ファイル構成

### Layer 0: Configuration & Infrastructure（基盤層）

| ファイル | 責務 |
|---------|------|
| `00_config_constants.js` | アプリケーション全体の定数定義 |
| `00_config_app.js` | アプリケーション設定（ログレベル） |
| `00_infra_logger.js` | ログレベル制御機能 |
| `00_infra_properties.js` | プロパティ管理 |

### Layer 1: Domain & Business Logic（ドメイン層）

| ファイル | 責務 |
|---------|------|
| `10_domain_dateUtils.js` | 日付関連ユーティリティ |

### Layer 2: Application Services（サービス層）

| ファイル | 責務 |
|---------|------|
| `20_service_notification.js` | LINE通知サービス |
| `20_service_spreadsheet.js` | スプレッドシート操作サービス |
| `20_service_fileTemplate.js` | ファイルテンプレートサービス（オーケストレーション） |

### Layer 3: Entry Points（エントリーポイント層）

| ファイル | 責務 |
|---------|------|
| `30_main.js` | GASトリガーから呼ばれるエントリーポイント |

## 依存関係図

```
30_main.js
├── 20_service_notification.js
│   ├── 00_config_constants.js
│   ├── 00_infra_properties.js
│   └── 00_infra_logger.js
└── 20_service_fileTemplate.js
    ├── 20_service_spreadsheet.js
    │   ├── 00_config_constants.js
    │   ├── 00_infra_properties.js
    │   ├── 00_infra_logger.js
    │   └── 10_domain_dateUtils.js
    ├── 20_service_notification.js
    └── 00_infra_logger.js
```

## データフロー

### 月次スプレッドシート作成フロー

```
1. createNextMonthSpreadsheet() 関数が呼び出される
2. createNextMonthSpreadsheetWithNotification() がオーケストレーション
3. createNextMonthSpreadsheetFile() でテンプレートを複製してファイル作成
   - 来月分が既に存在する場合は作成せず終了
4. 成功時、sendPost() でLINE通知
```

## 設定のカスタマイズ

### ログレベルの変更

`00_config_app.js` の `LOG_LEVEL` を変更:

```javascript
const APP_CONFIG = {
  LOG_LEVEL: "DEBUG" // DEBUG, INFO, WARN, ERROR
};
```

- `DEBUG`: 詳細なデバッグログを出力（開発時推奨）
- `INFO`: 情報ログを出力（通常運用）
- `WARN`: 警告ログのみ出力
- `ERROR`: エラーログのみ出力

WARN以上のログは `20_service_notification.js` のコールバックを通じてLINEにも通知されます。

## Google Apps Scriptでの設定

### プロジェクトプロパティ

以下のプロジェクトプロパティを設定してください：

| プロパティ名 | 説明 |
|-------------|------|
| `FOLDER_ID` | Google DriveフォルダID |
| `LINE_API_TOKEN` | LINE Bot APIトークン |
| `LOG_NOTIFICATION_ENABLED` | ログのLINE通知ON/OFF（任意、デフォルト有効） |

### トリガー設定

| 関数名 | 実行タイミング | 説明 |
|--------|---------------|------|
| `createNextMonthSpreadsheet` | 毎月 | 来月のスプレッドシート作成 |

## 設計方針

### 責務の分離

- **Layer 0**: 設定とインフラ機能のみ
- **Layer 1**: ビジネスロジックのみ（外部依存なし）
- **Layer 2**: 外部サービス連携（Spreadsheet, LINE）
- **Layer 3**: エントリーポイントのみ

### 依存方向

- 下位レイヤーは上位レイヤーに依存しない
- 依存は常に上から下への一方向

### テスタビリティ

- ドメイン層（Layer 1）は外部依存がなく、単体テストが容易
- 各関数は単一責任を持ち、テストしやすい構造

## 変更履歴

- 2026-06-27: 日次のカード利用情報取得機能（`main`）を削除（別システムへ移行）
  - 削除ファイル: `20_service_cardUsage.js` / `20_service_gmail.js` / `10_domain_cardConfig.js` / `10_domain_cardParser.js`
  - 月次スプレッドシート作成機能（`createNextMonthSpreadsheet`）のみを残す構成に整理
- 2025-12-06: レイヤードアーキテクチャに再構成
  - 6ファイル → 13ファイルに分割
  - ログレベル制御機能を追加
  - ユーザー名を定数化
  - 責務の明確な分離を実現
