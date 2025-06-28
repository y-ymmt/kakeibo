/**
 * LINE通知サービス
 * LINE APIを使用した通知機能を提供
 */

/**
 * 引数（content）に渡された文字列を家計簿通知botに送信する
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
      console.error("LINE API呼び出しに失敗しました:", response.getContentText());
    }
    
  } catch (error) {
    console.error("sendPost でエラーが発生しました:", error);
  }
}
