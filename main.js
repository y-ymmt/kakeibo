/**
 * 家計簿自動化システムのメインファイル
 * 各サービスのエントリーポイントを提供
 * 
 * 依存ファイル:
 * - constants.js: アプリケーション定数
 * - utils.js: ユーティリティ関数
 * - lineNotificationService.js: LINE通知機能
 * - spreadsheetService.js: スプレッドシート操作
 * - cardInfoService.js: カード利用情報取得
 */

/**
 * メイン実行関数 - カード利用情報の取得と登録
 * Google Apps Scriptのトリガーから定期実行される
 */
function main() {
  try {
    console.log("カード利用情報の取得を開始します");
    mainGetCardUsageInfoFromMail();
    console.log("カード利用情報の取得が完了しました");
  } catch (error) {
    console.error("メイン処理でエラーが発生しました:", error);
    sendPost("システムエラーが発生しました。管理者に連絡してください。");
  }
}

/**
 * テンプレート複製の実行関数
 * 月次でスプレッドシートのテンプレートを複製する際に使用
 */
function createNextMonthSpreadsheet() {
  try {
    console.log("来月のスプレッドシート作成を開始します");
    copy_template_file();
    console.log("来月のスプレッドシート作成が完了しました");
  } catch (error) {
    console.error("スプレッドシート作成でエラーが発生しました:", error);
    sendPost("スプレッドシート作成でエラーが発生しました。管理者に連絡してください。");
  }
}












