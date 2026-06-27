/**
 * 家計簿自動化システム - エントリーポイント
 * Layer 3: Entry Point
 *
 * Google Apps Scriptのトリガーから呼び出されるメイン関数を定義
 *
 * ファイル読み込み順序（GASはアルファベット順に読み込む）:
 * 00_config_constants.js     - 定数定義
 * 00_config_app.js           - アプリケーション設定
 * 00_infra_logger.js         - ログユーティリティ
 * 00_infra_properties.js     - プロパティ管理
 * 10_domain_dateUtils.js     - 日付ユーティリティ
 * 20_service_notification.js - LINE通知サービス
 * 20_service_spreadsheet.js  - スプレッドシートサービス
 * 20_service_fileTemplate.js - ファイルテンプレートサービス
 * 30_main.js                 - エントリーポイント（このファイル）
 *
 * 依存:
 * - 20_service_fileTemplate.js (createNextMonthSpreadsheetWithNotification)
 * - 20_service_notification.js (initializeLogNotification)
 */

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
  // ログ通知機能の初期化（error/warnログをLINEに通知）
  initializeLogNotification();

  createNextMonthSpreadsheetWithNotification();
}
