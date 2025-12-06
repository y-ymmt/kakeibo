/**
 * ファイルテンプレートサービス
 * Layer 2: Application Service
 *
 * テンプレートファイル操作のオーケストレーション層
 *
 * 依存:
 * - 00_infra_logger.js (AppLogger)
 * - 20_service_spreadsheet.js (createNextMonthSpreadsheetFile)
 * - 20_service_notification.js (sendPost)
 */

/**
 * 来月のスプレッドシート作成とユーザー通知
 */
function createNextMonthSpreadsheetWithNotification() {
  try {
    AppLogger.info("来月のスプレッドシート作成を開始します");

    const result = createNextMonthSpreadsheetFile();

    if (result.success && result.fileUrl) {
      const message = `${result.fileName}のスプレッドシートを作成しました。以下のURLからアクセスできます。\n${result.fileUrl}`;
      sendPost(message);
      AppLogger.info("来月のスプレッドシート作成が完了しました");
    } else if (!result.success && result.fileName) {
      // 既に存在する場合や失敗した場合
      AppLogger.info(result.message);
    }

  } catch (error) {
    AppLogger.error("スプレッドシート作成でエラーが発生しました:", error);
    sendPost("スプレッドシートの作成中にエラーが発生しました。");
  }
}
