/**
 * カード利用情報サービス
 * Layer 2: Application Service
 *
 * カード利用情報の取得・登録を制御するオーケストレーション層
 *
 * 依存:
 * - 00_infra_logger.js (AppLogger)
 * - 10_domain_dateUtils.js (getYesterday)
 * - 10_domain_cardConfig.js (CARD_CONFIGS)
 * - 10_domain_cardParser.js (extractCardUsageFromThreads)
 * - 20_service_gmail.js (searchGmailThreads)
 * - 20_service_spreadsheet.js (addPaymentInfoToSpreadsheet)
 * - 20_service_notification.js (sendPost)
 */

/**
 * 指定されたカード設定に基づいてメールから利用情報を取得し、スプレッドシートに追加する
 * @param {Object} config - カード設定
 */
function processCardUsageFromMail(config) {
  try {
    const yesterday = getYesterday();
    const threads = searchGmailThreads(config.subject, yesterday);

    if (threads.length === 0) {
      AppLogger.info(`（${config.cardType} ${config.transactionType}）カード利用情報はありませんでした。`);
      return;
    }

    const cardUsages = extractCardUsageFromThreads(threads, config);

    if (cardUsages.length === 0) {
      AppLogger.info(`（${config.cardType} ${config.transactionType}）解析可能な情報がありませんでした。`);
      return;
    }

    addPaymentInfoToSpreadsheet(cardUsages);
    sendPost(`（${config.cardType} ${config.transactionType}）カード利用情報を${cardUsages.length}件登録しました。`);

  } catch (error) {
    AppLogger.error(`processCardUsageFromMail でエラーが発生しました (${config.cardType}):`, error);
    sendPost(`（${config.cardType} ${config.transactionType}）カード利用情報の取得中にエラーが発生しました。`);
  }
}

/**
 * 全カードの利用情報を処理
 */
function processAllCardUsages() {
  Object.values(CARD_CONFIGS).forEach(config => {
    processCardUsageFromMail(config);
  });
}
