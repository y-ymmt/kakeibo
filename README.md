# 家計簿自動化システム

Google Apps Scriptを使用した家計簿自動化システムです。月次で家計簿スプレッドシートのテンプレートを自動複製し、LINE通知を行います。

> 補足: 以前はGmailからカード利用情報を取得してスプレッドシートに記録する日次処理（`main`）も備えていましたが、別システムへ移行したため削除しました。現在は月次のスプレッドシート作成のみを担います。

## 機能

- **月次テンプレート作成**: 毎月、来月分のスプレッドシートをテンプレートから自動作成
- **LINE通知**: 作成結果やエラー/警告ログをLINE Botで通知

## ファイル構成

```
├── 00_config_constants.js     # 定数定義
├── 00_config_app.js           # アプリケーション設定（ログレベル）
├── 00_infra_logger.js         # ログユーティリティ
├── 00_infra_properties.js     # プロパティ管理
├── 10_domain_dateUtils.js     # 日付ユーティリティ
├── 20_service_notification.js # LINE通知サービス
├── 20_service_spreadsheet.js  # スプレッドシート操作
├── 20_service_fileTemplate.js # ファイルテンプレートサービス
├── 30_main.js                 # エントリーポイント
├── ARCHITECTURE.md            # アーキテクチャ詳細
├── package.json               # プロジェクト設定
└── README.md                  # このファイル
```

詳細なアーキテクチャについては [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## セットアップ

### 1. 環境準備

Node.jsとclaspが必要です：

```bash
node -v
clasp -v
```

#### インストール
```bash
# Node.js: 公式サイトからダウンロード
# clasp: npm経由でインストール
npm install -g @google/clasp
```

### 2. Google Apps Script設定

```bash
# Googleアカウントにログイン
clasp login

# プロジェクトをGASに反映
clasp push
```

### 3. 環境変数設定

Google Apps Scriptのプロジェクトプロパティで以下を設定：

- `FOLDER_ID`: Google DriveフォルダID
- `LINE_API_TOKEN`: LINE Bot APIトークン

### 4. トリガー設定

- `createNextMonthSpreadsheet()`: 月次実行（テンプレート作成用）

## 使用方法

### 基本的な使用フロー

1. **月次自動実行**: `createNextMonthSpreadsheet()`関数が定期実行され、来月分のスプレッドシートをテンプレートから作成
2. **通知送信**: 作成結果がLINE Botで通知

### 手動実行

Google Apps Scriptエディタから直接関数を実行可能：
- スプレッドシート作成: `createNextMonthSpreadsheet()`

## 開発

### コード修正の反映

```bash
clasp push
```

## トラブルシューティング

エラーが発生した場合は以下を確認：

1. プロジェクトプロパティの設定
2. Google Driveのアクセス権限
3. LINE Bot APIトークンの有効性

詳細は [clasp公式ドキュメント](https://github.com/google/clasp) または [参考記事](https://qiita.com/zumi0/items/a4dd6e00cad7ee341d77) を参照してください。
