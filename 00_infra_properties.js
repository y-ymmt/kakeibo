/**
 * プロパティ管理ユーティリティ
 * Layer 0: Infrastructure
 *
 * Google Apps Scriptのプロパティサービスへのアクセスを提供
 *
 * 依存: なし
 */

/**
 * プロジェクトプロパティを取得する
 * @param {string} key - プロパティキー
 * @returns {string} プロパティ値
 * @throws {Error} プロパティが設定されていない場合
 */
function getProperty(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(`プロジェクトプロパティ '${key}' が設定されていません。`);
  }
  return value;
}

/**
 * プロジェクトプロパティを取得する（デフォルト値付き）
 * @param {string} key - プロパティキー
 * @param {string} defaultValue - プロパティが設定されていない場合のデフォルト値
 * @returns {string} プロパティ値またはデフォルト値
 */
function getPropertyOrDefault(key, defaultValue) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value || defaultValue;
}
