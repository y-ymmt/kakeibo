/**
 * LINE通知サービス
 * Layer 2: Application Service
 *
 * LINE Messaging APIを使用した通知機能を提供
 *
 * 依存:
 * - 00_config_constants.js (CONSTANTS)
 * - 00_infra_properties.js (getProperty, getPropertyOrDefault)
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
      // console.errorを使用（AppLogger.errorを使うとログ通知で無限ループの可能性）
      console.error("LINE API呼び出しに失敗しました:", response.getContentText());
    }

  } catch (error) {
    // console.errorを使用（AppLogger.errorを使うとログ通知で無限ループの可能性）
    console.error("sendPost でエラーが発生しました:", error);
  }
}

/**
 * エラー/警告ログをLINEに通知する
 * AppLoggerのコールバックから呼び出される専用関数
 *
 * @param {string} levelName - ログレベル名 (ERROR, WARN)
 * @param {string} message - ログメッセージ
 */
function notifyLogToLine(levelName, message) {
  // スクリプトプロパティで通知ON/OFFを制御（デフォルトは有効）
  const enableNotification = getPropertyOrDefault("LOG_NOTIFICATION_ENABLED", "true");
  if (enableNotification !== "true") {
    return;
  }

  try {
    const token = getProperty("LINE_API_TOKEN");
    const timestamp = Utilities.formatDate(new Date(), CONSTANTS.TIMEZONE, 'yyyy/MM/dd HH:mm');
    const content = `[${timestamp}] [${levelName}] ${message}`;

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

    // ここでは AppLogger を使わない（無限ループ防止）
    if (response.getResponseCode() !== 200) {
      console.error("ログ通知の送信に失敗しました:", response.getContentText());
    }

  } catch (error) {
    // 通知失敗時も console のみ（無限ループ防止）
    console.error("notifyLogToLine でエラーが発生しました:", error);
  }
}

/**
 * ログ通知機能を初期化する
 * この関数を実行するとエラー/警告ログのLINE通知が有効化される
 */
function initializeLogNotification() {
  AppLogger.setNotificationCallback(notifyLogToLine);
}
