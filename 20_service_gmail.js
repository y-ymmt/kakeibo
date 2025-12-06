/**
 * Gmail操作サービス
 * Layer 2: Application Service
 *
 * Gmail APIの操作を提供
 *
 * 依存:
 * - 00_config_constants.js (CONSTANTS)
 * - 10_domain_dateUtils.js (getYesterday)
 */

/**
 * 指定条件でGmailスレッドを検索
 * @param {string} subject - 検索対象の件名
 * @param {Date} afterDate - この日付以降のメールを検索
 * @returns {Array} Gmailスレッド配列
 */
function searchGmailThreads(subject, afterDate) {
  const formattedDate = Utilities.formatDate(afterDate, CONSTANTS.TIMEZONE, 'yyyy/MM/dd');
  const searchQuery = `subject:${subject} after:${formattedDate}`;
  return GmailApp.search(searchQuery);
}
