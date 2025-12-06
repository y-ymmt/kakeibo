# 家計簿自動化システム - アーキテクチャ

## 概要

このシステムは、Gmailに届くカード利用通知メールを自動解析し、Google Spreadsheetに記録、LINE通知を行う家計簿自動化ツールです。

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
| `00_config_app.js` | アプリケーション設定（ユーザー名、ログレベル） |
| `00_infra_logger.js` | ログレベル制御機能 |
| `00_infra_properties.js` | プロパティ管理 |

### Layer 1: Domain & Business Logic（ドメイン層）

| ファイル | 責務 |
|---------|------|
| `10_domain_dateUtils.js` | 日付関連ユーティリティ |
| `10_domain_cardConfig.js` | カード設定定義（新カード追加時はここに追記） |
| `10_domain_cardParser.js` | メール解析ロジック |

### Layer 2: Application Services（サービス層）

| ファイル | 責務 |
|---------|------|
| `20_service_gmail.js` | Gmail操作サービス |
| `20_service_notification.js` | LINE通知サービス |
| `20_service_spreadsheet.js` | スプレッドシート操作サービス |
| `20_service_cardUsage.js` | カード利用情報サービス（オーケストレーション） |
| `20_service_fileTemplate.js` | ファイルテンプレートサービス |

### Layer 3: Entry Points（エントリーポイント層）

| ファイル | 責務 |
|---------|------|
| `30_main.js` | GASトリガーから呼ばれるエントリーポイント |

## 依存関係図

```
30_main.js
├── 20_service_cardUsage.js
│   ├── 10_domain_cardParser.js
│   │   ├── 00_config_constants.js
│   │   ├── 00_config_app.js
│   │   └── 00_infra_logger.js
│   ├── 10_domain_cardConfig.js
│   ├── 20_service_gmail.js
│   │   └── 00_config_constants.js
│   ├── 20_service_spreadsheet.js
│   │   ├── 00_config_constants.js
│   │   ├── 00_infra_properties.js
│   │   ├── 00_infra_logger.js
│   │   └── 10_domain_dateUtils.js
│   └── 20_service_notification.js
│       ├── 00_config_constants.js
│       ├── 00_infra_properties.js
│       └── 00_infra_logger.js
└── 20_service_fileTemplate.js
    ├── 20_service_spreadsheet.js
    ├── 20_service_notification.js
    └── 00_infra_logger.js
```

## データフロー

### カード利用情報登録フロー

```
1. main() 関数が呼び出される
2. processAllCardUsages() が全カード設定をループ
3. 各カード設定に対して:
   a. searchGmailThreads() でメール検索
   b. extractCardUsageFromThreads() でデータ抽出
   c. addPaymentInfoToSpreadsheet() でスプレッドシート登録
   d. sendPost() でLINE通知
```

### 月次スプレッドシート作成フロー

```
1. createNextMonthSpreadsheet() 関数が呼び出される
2. createNextMonthSpreadsheetFile() でファイル作成
3. 成功時、sendPost() でLINE通知
```

## 設定のカスタマイズ

### ユーザー名の変更

`00_config_app.js` の `DEFAULT_USER_NAME` を変更:

```javascript
const APP_CONFIG = {
  DEFAULT_USER_NAME: "任意の名前",
  // ...
};
```

### ログレベルの変更

`00_config_app.js` の `LOG_LEVEL` を変更:

```javascript
const APP_CONFIG = {
  // ...
  LOG_LEVEL: "DEBUG" // DEBUG, INFO, WARN, ERROR
};
```

- `DEBUG`: 詳細なデバッグログを出力（開発時推奨）
- `INFO`: 情報ログを出力（通常運用）
- `WARN`: 警告ログのみ出力
- `ERROR`: エラーログのみ出力

### 新しいカードの追加

`10_domain_cardConfig.js` に設定を追加:

```javascript
const CARD_CONFIGS = {
  // 既存の設定...

  NEW_CARD: {
    subject: "メールの件名",
    regTime: /日付を抽出する正規表現/,
    regAmount: /金額を抽出する正規表現/,
    regStore: /利用先を抽出する正規表現/,
    cardType: "表示名",
    transactionType: "出金" // または "入金"
  }
};
```

## Google Apps Scriptでの設定

### プロジェクトプロパティ

以下のプロジェクトプロパティを設定してください：

| プロパティ名 | 説明 |
|-------------|------|
| `FOLDER_ID` | Google DriveフォルダID |
| `LINE_API_TOKEN` | LINE Bot APIトークン |

### トリガー設定

| 関数名 | 実行タイミング | 説明 |
|--------|---------------|------|
| `main` | 毎日 | カード利用情報の取得・登録 |
| `createNextMonthSpreadsheet` | 毎月 | 来月のスプレッドシート作成 |

## 設計方針

### 責務の分離

- **Layer 0**: 設定とインフラ機能のみ
- **Layer 1**: ビジネスロジックのみ（外部依存なし）
- **Layer 2**: 外部サービス連携（Gmail, Spreadsheet, LINE）
- **Layer 3**: エントリーポイントのみ

### 依存方向

- 下位レイヤーは上位レイヤーに依存しない
- 依存は常に上から下への一方向

### 拡張性

- 新しいカード追加: `10_domain_cardConfig.js` に設定追加のみ
- 新しい通知手段: `20_service_*.js` として追加

### テスタビリティ

- ドメイン層（Layer 1）は外部依存がなく、単体テストが容易
- 各関数は単一責任を持ち、テストしやすい構造

## 変更履歴

- 2025-12-06: レイヤードアーキテクチャに再構成
  - 6ファイル → 13ファイルに分割
  - ログレベル制御機能を追加
  - ユーザー名を定数化
  - 責務の明確な分離を実現
