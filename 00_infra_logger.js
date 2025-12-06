/**
 * ログユーティリティ
 * Layer 0: Infrastructure
 *
 * ログレベルに基づいた出力制御を提供
 *
 * 依存: 00_config_app.js (APP_CONFIG)
 */

/** ログレベル定義 */
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * アプリケーションロガー
 */
const AppLogger = {
  /**
   * 通知コールバック関数（外部から設定可能）
   * @type {Function|null}
   * @private
   */
  _notificationCallback: null,

  /**
   * 通知中フラグ（無限ループ防止）
   * @type {boolean}
   * @private
   */
  _isNotifying: false,

  /**
   * 通知コールバックを設定
   * @param {Function} callback - 通知関数 (levelName, message) => void
   */
  setNotificationCallback: function(callback) {
    this._notificationCallback = callback;
  },

  /**
   * 現在のログレベルを取得
   * スクリプトプロパティ > APP_CONFIG > デフォルト(INFO) の優先順位で取得
   * @returns {number} ログレベル
   * @private
   */
  _getLogLevel: function() {
    const defaultLevel = APP_CONFIG.LOG_LEVEL || "INFO";
    const configLevel = getPropertyOrDefault("LOG_LEVEL", defaultLevel);
    return LOG_LEVEL[configLevel] !== undefined ? LOG_LEVEL[configLevel] : LOG_LEVEL.INFO;
  },

  /**
   * タイムスタンプを取得
   * @returns {string} フォーマットされたタイムスタンプ
   * @private
   */
  _getTimestamp: function() {
    return Utilities.formatDate(new Date(), CONSTANTS.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  },

  /**
   * ログを出力
   * @param {number} level - ログレベル
   * @param {string} levelName - ログレベル名
   * @param {string} message - メッセージ
   * @param {*} [data] - 追加データ（オプション）
   * @private
   */
  _log: function(level, levelName, message, data) {
    if (level >= this._getLogLevel()) {
      const timestamp = this._getTimestamp();
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;

      if (level >= LOG_LEVEL.ERROR) {
        console.error(logMessage);
        if (data !== undefined) {
          console.error(data);
        }
      } else {
        console.log(logMessage);
        if (data !== undefined) {
          console.log(data);
        }
      }

      // WARN以上のログで通知コールバックを実行（無限ループ防止付き）
      if (level >= LOG_LEVEL.WARN && this._notificationCallback && !this._isNotifying) {
        try {
          this._isNotifying = true;
          this._notificationCallback(levelName, message);
        } catch (error) {
          console.error("通知コールバックでエラーが発生しました:", error);
        } finally {
          this._isNotifying = false;
        }
      }
    }
  },

  /**
   * デバッグログを出力（LOG_LEVEL=DEBUGの場合のみ）
   * @param {string} message - メッセージ
   * @param {*} [data] - 追加データ（オプション）
   */
  debug: function(message, data) {
    this._log(LOG_LEVEL.DEBUG, 'DEBUG', message, data);
  },

  /**
   * 情報ログを出力（LOG_LEVEL=INFO以下の場合）
   * @param {string} message - メッセージ
   * @param {*} [data] - 追加データ（オプション）
   */
  info: function(message, data) {
    this._log(LOG_LEVEL.INFO, 'INFO', message, data);
  },

  /**
   * 警告ログを出力（LOG_LEVEL=WARN以下の場合）
   * @param {string} message - メッセージ
   * @param {*} [data] - 追加データ（オプション）
   */
  warn: function(message, data) {
    this._log(LOG_LEVEL.WARN, 'WARN', message, data);
  },

  /**
   * エラーログを出力（常に出力）
   * @param {string} message - メッセージ
   * @param {*} [data] - 追加データ（オプション）
   */
  error: function(message, data) {
    this._log(LOG_LEVEL.ERROR, 'ERROR', message, data);
  }
};
