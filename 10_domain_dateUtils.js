/**
 * 日付ユーティリティ
 * Layer 1: Domain
 *
 * 日付関連の処理を提供
 *
 * 依存: 00_config_constants.js (CONSTANTS)
 */

/**
 * 来月のファイル名を取得する
 * @returns {string} 来月のファイル名（例：2024年7月）
 */
function getNextMonthFileName() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Utilities.formatDate(nextMonth, CONSTANTS.TIMEZONE, "yyyy年M月");
}

/**
 * 現在月のファイル名を取得する
 * @returns {string} 現在月のファイル名（例：2024年6月）
 */
function getCurrentMonthFileName() {
  const now = new Date();
  return Utilities.formatDate(now, CONSTANTS.TIMEZONE, "yyyy年M月");
}

/**
 * 昨日の日付を取得する
 * @returns {Date} 昨日の日付
 */
function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

