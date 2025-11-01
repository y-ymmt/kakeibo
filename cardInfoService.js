/**
 * カード利用情報サービス
 * メールからカード利用情報を取得し、スプレッドシートに追加する機能を提供
 */

/**
 * メールスレッドからカード利用情報を抽出する
 * @param {Array} threads - Gmailスレッド配列
 * @param {RegExp} regTime - 時刻抽出用正規表現
 * @param {RegExp} regAmount - 金額抽出用正規表現
 * @param {RegExp} regStore - 利用先抽出用正規表現
 * @param {string} cardType - カード種類
 * @param {string} transactionType - 取引種類
 * @returns {Array<Array>} カード利用情報の配列
 */
function extractCardUsageFromThreads(threads, regTime, regAmount, regStore, cardType, transactionType) {
  const cardUsages = [];
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const body = message.getPlainBody();

      const dateTimeMatch = regTime instanceof RegExp ? body.match(regTime) : (regTime || true);
      const amountMatch = regAmount instanceof RegExp ? body.match(regAmount) : (regAmount || true);
      const storeMatch = regStore instanceof RegExp ? body.match(regStore) : (regStore || true);

      // デバッグログ
      Logger.log(`=== ${cardType} ${transactionType} のマッチング結果 ===`);
      Logger.log(`dateTimeMatch: ${dateTimeMatch ? 'OK' : 'NG'}`);
      Logger.log(`amountMatch: ${amountMatch ? 'OK' : 'NG'}`);
      Logger.log(`storeMatch: ${storeMatch ? 'OK' : 'NG'}`);
      if (!dateTimeMatch || !amountMatch || !storeMatch) {
        Logger.log(`メール本文（最初の500文字）:\n${body.substring(0, 500)}`);
      }

      if (dateTimeMatch && amountMatch && storeMatch) {
        let amount = "";
        if (regAmount instanceof RegExp && amountMatch[1]) {
          amount = amountMatch[1];
          if (transactionType === "入金") {
            amount = `-${amount}`;
          }
          amount = amount.replace(/,/g, '');
        }
        
        // 日付文字列をDate オブジェクトに変換
        const dateStr = regTime instanceof RegExp ? dateTimeMatch[1] : dateTimeMatch;
        
        // dateStrが存在し、文字列型であることを確認
        if (!dateStr || typeof dateStr !== 'string') {
          Logger.log(`日付情報の抽出に失敗しました。dateStr: ${dateStr}`);
          Logger.log(`メール本文（最初の500文字）:\n${body.substring(0, 500)}`);
          return;
        }
        
        const dateStrFormatted = dateStr.replace(/年|月/g, '/').replace(/日/g, '');
        const date = new Date(dateStrFormatted);
        
        // 日付が有効かチェック
        if (isNaN(date.getTime())) {
          Logger.log(`無効な日付形式です。dateStr: ${dateStr}`);
          return;
        }
        
        const formattedDate = Utilities.formatDate(date, CONSTANTS.TIMEZONE, 'yyyy/MM/dd');

        const storeName = regStore instanceof RegExp ? storeMatch[1].trim() : storeMatch;

        cardUsages.push([
          "", "", 
          amount,
          storeName,
          "", "", "", "",
          cardType,
          "ゆう",
          formattedDate,
          "GASにより自動登録"
        ]);
      } else {
        Logger.log("カード利用情報が正しく抽出できませんでした。");
      }
    });
  });
  
  return cardUsages;
}

/**
 * メールからカード利用情報を取得し、スプレッドシートに追加する
 * @param {string} subject - メール件名
 * @param {RegExp} regTime - 時刻抽出用正規表現
 * @param {RegExp} regAmount - 金額抽出用正規表現
 * @param {RegExp} regStore - 利用先抽出用正規表現
 * @param {string} cardType - カード種類
 * @param {string} transactionType - 取引種類（入金/出金）
 */
function getCardUsageInfoFromMail(subject, regTime, regAmount, regStore, cardType, transactionType) {
  try {
    const yesterday = getYesterday();
    const formattedDate = Utilities.formatDate(yesterday, CONSTANTS.TIMEZONE, 'yyyy/MM/dd');
    const searchQuery = `subject:${subject} after:${formattedDate}`;
    
    const threads = GmailApp.search(searchQuery);
    
    if (threads.length === 0) {
      Logger.log(`（${cardType} ${transactionType}）カード利用情報はありませんでした。`);
      return;
    }
    
    const cardUsages = extractCardUsageFromThreads(threads, regTime, regAmount, regStore, cardType, transactionType);
    
    if (cardUsages.length === 0) {
      Logger.log(`（${cardType} ${transactionType}）カード利用情報はありませんでした。`);
      return;
    }
    
    addPaymentInfoToSpreadsheet(cardUsages);
    sendPost(`（${cardType} ${transactionType}）カード利用情報を${cardUsages.length}件登録しました。`);
  } catch (error) {
    console.error(`getCardUsageInfoFromMail でエラーが発生しました (${cardType}):`, error);
    sendPost(`（${cardType} ${transactionType}）カード利用情報の取得中にエラーが発生しました。`);
  }
}

/**
 * カード利用情報の設定定義
 */
const CARD_CONFIGS = {
  MUFG_JCB_DEBIT: {
    subject: "【三菱UFJ-JCBデビット】ご利用のお知らせ",
    regTime: /【ご利用日時\(日本時間\)】　(\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2})/,
    regAmount: /【ご利用金額】　(-?[0-9,]+)円/,
    regStore: /【ご利用先】　([^\r\n]+)/,
    cardType: "三菱カード",
    transactionType: "出金"
  },
  SUMITOMO_CARD: {
    subject: "ご利用のお知らせ【三井住友カード】",
    regTime: /◇利用日[\s　]*：(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2})/,
    regAmount: /◇利用金額：(-?[0-9,]+)円/,
    regStore: /◇利用先[\s　]*：([^\r\n]+)/,
    cardType: "三井住友カード",
    transactionType: "出金"
  },
  SUMITOMO_BANK_TRANSFER: {
    subject: "【三井住友銀行】振込入金のお知らせ",
    regTime: /入金日[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)/,
    regAmount: /金額[\s　]*：[\s　]*(-?[0-9,]+)円/,
    regStore: /内容[\s　]*：[\s　]*([^\r\n]+)/,
    cardType: "三井住友カード",
    transactionType: "入金"
  },
  SUMITOMO_SHUKKIN: {
    subject: "【三井住友銀行】口座出金のお知らせ",
    regTime: /出金日[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)/,
    regAmount: /出金額[\s　]*：[\s　]*(-?[0-9,]+)円/,
    regStore: /内容[\s　]*：[\s　]*([^\r\n]+)/,
    cardType: "三井住友カード",
    transactionType: "出金"
  },
  SUMITOMO_FURIKOMI_SHUKKIN: {
    subject: "【三井住友銀行】振込受付完了のお知らせ",
    regTime: /受付日時[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)[\s　]*\d{1,2}時[\s　]*\d{1,2}分/,
    regAmount: null, // nullに変更して金額チェックをスキップ
    regStore: "インターネットバンキングによる振込",
    cardType: "三井住友カード",
    transactionType: "出金"
  }
};

/**
 * 三菱カード・三井住友カード情報取得のメイン関数
 */
function mainGetCardUsageInfoFromMail() {
  // 設定された全てのカードの情報を処理
  Object.values(CARD_CONFIGS).forEach(config => {
    getCardUsageInfoFromMail(
      config.subject,
      config.regTime,
      config.regAmount,
      config.regStore,
      config.cardType,
      config.transactionType
    );
  });
}
