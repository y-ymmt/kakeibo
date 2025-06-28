# 家計簿自動化システム

Google Apps Scriptを使用した家計簿自動化システムです。メールからカード利用情報を自動取得し、スプレッドシートに記録、LINE通知を行います。

## 機能

- **カード利用情報の自動取得**: Gmail経由で各種カードの利用通知メールから情報を抽出
- **スプレッドシート自動記録**: 取得した情報を自動的にGoogle Spreadsheetに記録
- **LINE通知**: 処理結果をLINE Botで通知
- **月次テンプレート作成**: 毎月新しいスプレッドシートを自動作成

## 対応カード

- 三菱UFJ-JCBデビット
- 三井住友カード
- 三井住友銀行振込入金

## ファイル構成

```
├── main.js                      # メイン処理・エントリーポイント
├── constants.js                 # 定数定義
├── utils.js                     # ユーティリティ関数
├── lineNotificationService.js   # LINE通知機能
├── spreadsheetService.js        # スプレッドシート操作
├── cardInfoService.js           # カード情報処理
├── ARCHITECTURE.md              # アーキテクチャ詳細
├── package.json                 # プロジェクト設定
└── README.md                    # このファイル
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

- `main()`: 日次実行（カード情報取得用）
- `createNextMonthSpreadsheet()`: 月次実行（テンプレート作成用）

## 使用方法

### 基本的な使用フロー

1. **日次自動実行**: `main()`関数が定期実行され、前日のカード利用情報をメールから取得
2. **データ記録**: 取得した情報がスプレッドシートに自動記録
3. **通知送信**: 処理結果がLINE Botで通知
4. **月次処理**: `createNextMonthSpreadsheet()`で新月のスプレッドシートを作成

### 手動実行

Google Apps Scriptエディタから直接関数を実行可能：
- カード情報取得: `main()`
- スプレッドシート作成: `createNextMonthSpreadsheet()`

## 開発

### コード修正の反映

```bash
clasp push
```

### 新しいカードの追加

`cardInfoService.js`の`CARD_CONFIGS`オブジェクトに新しい設定を追加してください。

## トラブルシューティング

エラーが発生した場合は以下を確認：

1. プロジェクトプロパティの設定
2. Google DriveとGmailのアクセス権限
3. LINE Bot APIトークンの有効性

詳細は [clasp公式ドキュメント](https://github.com/google/clasp) または [参考記事](https://qiita.com/zumi0/items/a4dd6e00cad7ee341d77) を参照してください。

## ライセンス

ISC
