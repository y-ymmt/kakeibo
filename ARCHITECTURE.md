# 家計簿自動化システム - アーキテクチャ

## ファイル構成

### `main.js`
- **役割**: エントリーポイント
- **機能**: 
  - メイン実行関数の提供
  - エラーハンドリング
  - 各サービスの呼び出し

### `constants.js`
- **役割**: 定数管理
- **機能**:
  - アプリケーション全体で使用する定数定義
  - 設定値の一元管理

### `utils.js`
- **役割**: ユーティリティ関数
- **機能**:
  - 共通的に使用される関数
  - 日付処理、プロパティ取得、フォーマット関数

### `lineNotificationService.js`
- **役割**: LINE通知機能
- **機能**:
  - LINE API連携
  - メッセージ送信機能

### `spreadsheetService.js`
- **役割**: スプレッドシート操作
- **機能**:
  - Google Spreadsheet操作
  - テンプレート複製
  - データ追加・取得

### `cardInfoService.js`
- **役割**: カード情報処理
- **機能**:
  - メールからカード利用情報抽出
  - 複数カード対応の設定管理
  - データ変換・整形

## 依存関係

```
main.js
├── cardInfoService.js
│   ├── spreadsheetService.js
│   │   └── utils.js
│   │   └── constants.js
│   └── lineNotificationService.js
│       └── utils.js
│       └── constants.js
└── utils.js
└── constants.js
```

## メリット

### 可読性の向上
- 機能ごとにファイルが分離され、コードの目的が明確
- 各ファイルの責任範囲が明確

### 保守性の向上
- 機能ごとの修正が容易
- 影響範囲の特定が簡単
- テストしやすい構造

### 拡張性の向上
- 新しいカード対応の追加が容易
- 新機能の追加時の影響範囲が限定的
- 設定の変更が一箇所で可能

### 再利用性の向上
- ユーティリティ関数の再利用
- サービス単位での機能再利用

## 使用方法

### Google Apps Scriptでの設定
1. 各ファイルをGoogle Apps Scriptプロジェクトにアップロード
2. `main()` 関数を定期実行するトリガーを設定
3. `createNextMonthSpreadsheet()` 関数を月次実行するトリガーを設定

### 設定値
以下のプロジェクトプロパティを設定してください：
- `FOLDER_ID`: Google DriveフォルダID
- `LINE_API_TOKEN`: LINE Bot APIトークン
