/**
 * LINE通知サービス
 * Layer 2: Application Service
 *
 * LINE Messaging APIを使用した通知機能を提供
 *
 * 依存:
 * - 00_config_constants.js (CONSTANTS)
 * - 00_infra_properties.js (getProperty)
 * - 00_infra_logger.js (AppLogger)
 */

/**
 * LINEにメッセージを送信する
 * @param {string} content - 送信するメッセージ内容
 */
function sendPost(content) {
  try {
    const token = getProperty("LINE_API_TOKEN");

    const response = UrlFetchApp.fetch(CONSTANTS.LINE_API.BROADCAST_URL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      payload: JSON.stringify({
        messages: [{
          type: 'text',
          text: content
        }]
      })
    });

    if (response.getResponseCode() !== 200) {
      AppLogger.error("LINE API呼び出しに失敗しました:", response.getContentText());
    }

  } catch (error) {
    AppLogger.error("sendPost でエラーが発生しました:", error);
  }
}
