/**
 * アプリケーション全体で使用する定数定義
 * Layer 0: Configuration
 *
 * 依存: なし
 */
const CONSTANTS = {
  /** テンプレートファイル名 */
  TEMPLATE_FILE_NAME: "テンプレート",

  /** 家計簿の中央マスタスプレッドシートID */
  MASTER_SPREADSHEET_ID: "1wlGH4TWBhjT-B_f4T9SYW3dLdr6AAOuSbaesl4_ulSQ",

  /** 中央マスタのシート名 */
  MASTER_SHEETS: {
    FIXED_COST: "固定費",
    PAYMENT_METHOD: "決済方法",
    USER: "利用者"
  },

  /** 月別スプレッドシートのシート名 */
  MONTHLY_SHEETS: {
    SUMMARY: "集計",
    LIST: "リスト"
  },

  /** タイムゾーン */
  TIMEZONE: "Asia/Tokyo",

  /** LINE API設定 */
  LINE_API: {
    BROADCAST_URL: 'https://api.line.me/v2/bot/message/broadcast'
  }
};
