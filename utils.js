/**
 * ユーティリティ関数群
 */

/**
 * プロジェクトプロパティを取得する
 * @param {string} key - プロパティキー
 * @returns {string} プロパティ値
 */
function getProperty(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(`プロジェクトプロパティ '${key}' が設定されていません。`);
  }
  return value;
}

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
 * ファイルが存在するかチェックする
 * @param {DriveApp.Folder} folder - 検索対象フォルダ
 * @param {string} fileName - ファイル名
 * @returns {boolean} ファイルが存在するかどうか
 */
function isFileExists(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  return files.hasNext();
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

/**
 * 指定された数値を金額表示に変換する
 * @param {number} number - 変換する数値
 * @returns {string} フォーマットされた金額文字列
 */
function convertToCurrencyFormat(number) {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }
  return Number(number).toLocaleString('ja-JP');
}
