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

