/**
 * 家計簿自動化システム - エントリーポイント
 * Layer 3: Entry Point
 *
 * Google Apps Scriptのトリガーから呼び出されるメイン関数を定義
 *
 * ファイル読み込み順序（GASはアルファベット順に読み込む）:
 * 00_config_constants.js    - 定数定義
 * 00_config_app.js          - アプリケーション設定
 * 00_infra_logger.js        - ログユーティリティ
 * 00_infra_properties.js    - プロパティ管理
 * 10_domain_dateUtils.js    - 日付ユーティリティ
 * 10_domain_cardConfig.js   - カード設定
 * 10_domain_cardParser.js   - カード情報解析
 * 20_service_gmail.js       - Gmail操作サービス
 * 20_service_notification.js - LINE通知サービス
 * 20_service_spreadsheet.js - スプレッドシートサービス
 * 20_service_cardUsage.js   - カード利用情報サービス
 * 20_service_fileTemplate.js - ファイルテンプレートサービス
 * 30_main.js                - エントリーポイント（このファイル）
 *
 * 依存:
 * - 00_infra_logger.js (AppLogger)
 * - 20_service_cardUsage.js (processAllCardUsages)
 * - 20_service_fileTemplate.js (createNextMonthSpreadsheetWithNotification)
 * - 20_service_notification.js (sendPost)
 */

/**
 * メイン実行関数 - カード利用情報の取得と登録
 * Google Apps Scriptのトリガーから定期実行される
 *
 * @function main
 * @description
 * 設定された全てのカード（三菱UFJ-JCBデビット、三井住友カードなど）について
 * 前日のメールを検索し、利用情報を抽出してスプレッドシートに登録します。
 */
function main() {
  try {
    AppLogger.info("カード利用情報の取得を開始します");
    processAllCardUsages();
    AppLogger.info("カード利用情報の取得が完了しました");
  } catch (error) {
    AppLogger.error("メイン処理でエラーが発生しました:", error);
    sendPost("システムエラーが発生しました。管理者に連絡してください。");
  }
}

/**
 * テンプレート複製の実行関数
 * 月次でスプレッドシートのテンプレートを複製する際に使用
 *
 * @function createNextMonthSpreadsheet
 * @description
 * 来月のスプレッドシートがまだ存在しない場合、
 * テンプレートファイルを複製して新しいスプレッドシートを作成します。
 * 作成完了後、LINEで通知を送信します。
 */
function createNextMonthSpreadsheet() {
  createNextMonthSpreadsheetWithNotification();
}
