/**
 * アプリケーション全体で使用する定数定義
 * Layer 0: Configuration
 *
 * 依存: なし
 */
const CONSTANTS = {
  /** テンプレートファイル名 */
  TEMPLATE_FILE_NAME: "テンプレート",

  /** シート名定義 */
  SHEET_NAME: {
    SUMMARY: "集計",
    EXPENSE_LIST: "支出一覧"
  },

  /** タイムゾーン */
  TIMEZONE: "Asia/Tokyo",

  /** LINE API設定 */
  LINE_API: {
    BROADCAST_URL: 'https://api.line.me/v2/bot/message/broadcast'
  }
};
