/**
 * カード情報解析サービス
 * Layer 1: Domain
 *
 * メール本文からカード利用情報を解析するロジック
 *
 * 依存:
 * - 00_config_constants.js (CONSTANTS)
 * - 00_config_app.js (APP_CONFIG)
 * - 00_infra_logger.js (AppLogger)
 */

/**
 * メール本文から取引情報をマッチングして抽出
 * @param {string} body - メール本文
 * @param {Object} config - カード設定
 * @returns {Object|null} マッチング結果 {dateTimeMatch, amountMatch, storeMatch}
 * @private
 */
function _matchTransactionData(body, config) {
  const dateTimeMatch = config.regTime instanceof RegExp
    ? body.match(config.regTime)
    : (config.regTime || true);

  const amountMatch = config.regAmount instanceof RegExp
    ? body.match(config.regAmount)
    : (config.regAmount || true);

  const storeMatch = config.regStore instanceof RegExp
    ? body.match(config.regStore)
    : (config.regStore || true);

  return { dateTimeMatch, amountMatch, storeMatch };
}

/**
 * 金額を処理する（カンマ除去、入金時の符号反転）
 * @param {Object} amountMatch - 金額のマッチング結果
 * @param {Object} config - カード設定
 * @returns {string} 処理済み金額
 * @private
 */
function _processAmount(amountMatch, config) {
  let amount = "";

  if (config.regAmount instanceof RegExp && amountMatch && amountMatch[1]) {
    amount = amountMatch[1];
    // 入金の場合はマイナス（収入として扱う）
    if (config.transactionType === "入金") {
      amount = `-${amount}`;
    }
    // カンマを除去
    amount = amount.replace(/,/g, '');
  }

  return amount;
}

/**
 * 日付文字列をフォーマットされた日付に変換
 * @param {Object} dateTimeMatch - 日付のマッチング結果
 * @param {Object} config - カード設定
 * @returns {string|null} フォーマットされた日付、または変換失敗時はnull
 * @private
 */
function _processDate(dateTimeMatch, config) {
  const dateStr = config.regTime instanceof RegExp
    ? (dateTimeMatch && dateTimeMatch[1])
    : dateTimeMatch;

  // 日付文字列のバリデーション
  if (!dateStr || typeof dateStr !== 'string') {
    AppLogger.debug(`日付情報の抽出に失敗しました。dateStr: ${dateStr}`);
    return null;
  }

  // 日付フォーマットを統一 (yyyy年M月d日 → yyyy/M/d)
  // 年→/, 月→/, 日→空 を個別に処理して正確に変換
  const dateStrFormatted = dateStr
    .replace(/年/g, '/')
    .replace(/月/g, '/')
    .replace(/日/g, '')
    .trim();
  const date = new Date(dateStrFormatted);

  // 日付の有効性チェック
  if (isNaN(date.getTime())) {
    AppLogger.debug(`無効な日付形式です。dateStr: ${dateStr}`);
    return null;
  }

  return Utilities.formatDate(date, CONSTANTS.TIMEZONE, 'yyyy/MM/dd');
}

/**
 * 利用先/店名を取得
 * @param {Object} storeMatch - 店名のマッチング結果
 * @param {Object} config - カード設定
 * @returns {string} 店名
 * @private
 */
function _processStoreName(storeMatch, config) {
  return config.regStore instanceof RegExp
    ? (storeMatch && storeMatch[1] ? storeMatch[1].trim() : '')
    : (typeof config.regStore === 'string' ? config.regStore : '');
}

/**
 * メール本文からカード利用情報を解析
 * @param {string} body - メール本文
 * @param {Object} config - カード設定
 * @returns {Object|null} 解析されたカード利用情報、または解析失敗時はnull
 */
function parseCardUsageFromMailBody(body, config) {
  const { dateTimeMatch, amountMatch, storeMatch } = _matchTransactionData(body, config);

  // デバッグログ
  AppLogger.debug(`=== ${config.cardType} ${config.transactionType} のマッチング結果 ===`);
  AppLogger.debug(`dateTimeMatch: ${dateTimeMatch ? 'OK' : 'NG'}`);
  AppLogger.debug(`amountMatch: ${amountMatch ? 'OK' : 'NG'}`);
  AppLogger.debug(`storeMatch: ${storeMatch ? 'OK' : 'NG'}`);

  // マッチング失敗時のログ
  if (!dateTimeMatch || !amountMatch || !storeMatch) {
    AppLogger.debug(`メール本文（最初の500文字）:\n${body.substring(0, 500)}`);
    return null;
  }

  // 各フィールドを処理
  const formattedDate = _processDate(dateTimeMatch, config);
  if (!formattedDate) {
    AppLogger.debug(`メール本文（最初の500文字）:\n${body.substring(0, 500)}`);
    return null;
  }

  return {
    amount: _processAmount(amountMatch, config),
    storeName: _processStoreName(storeMatch, config),
    formattedDate: formattedDate,
    cardType: config.cardType,
    transactionType: config.transactionType
  };
}

/**
 * 解析済みデータをスプレッドシート行形式に変換
 * @param {Object} parsedData - 解析済みデータ
 * @returns {Array} スプレッドシート用配列
 */
function convertToSpreadsheetRow(parsedData) {
  return [
    "", "",                          // カテゴリ、サブカテゴリ（空欄）
    parsedData.amount,               // 金額
    parsedData.storeName,            // 利用先
    "", "", "", "",                  // 予備列（空欄）
    parsedData.cardType,             // カード種類
    APP_CONFIG.DEFAULT_USER_NAME,    // ユーザー名（定数から取得）
    parsedData.formattedDate,        // 日付
    "GASにより自動登録"              // 備考
  ];
}

/**
 * Gmailスレッドからカード利用情報を抽出
 * @param {Array} threads - Gmailスレッド配列
 * @param {Object} config - カード設定
 * @returns {Array<Array>} カード利用情報の配列（スプレッドシート形式）
 */
function extractCardUsageFromThreads(threads, config) {
  const cardUsages = [];

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const body = message.getPlainBody();
      const parsedData = parseCardUsageFromMailBody(body, config);

      if (parsedData) {
        cardUsages.push(convertToSpreadsheetRow(parsedData));
      } else {
        AppLogger.debug("カード利用情報が正しく抽出できませんでした。");
      }
    });
  });

  return cardUsages;
}
