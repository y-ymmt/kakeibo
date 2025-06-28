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
      
      const dateTimeMatch = body.match(regTime);
      const amountMatch = body.match(regAmount);
      const storeMatch = body.match(regStore);

      if (dateTimeMatch && amountMatch && storeMatch) {
        let amount = amountMatch[1];
        if (transactionType === "入金") {
          amount = `-${amount}`;
        }
        
        // 日付文字列をDate オブジェクトに変換
        const dateStr = dateTimeMatch[1];
        const date = new Date(dateStr.replace(/年|月/g, '/').replace(/日/g, ''));
        const formattedDate = Utilities.formatDate(date, CONSTANTS.TIMEZONE, 'yyyy/MM/dd');

        cardUsages.push([
          "", "", 
          amount.replace(/,/g, ''),
          storeMatch[1].trim(),
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
    sendPost(`（${cardType} ${transactionType}）カード利用情報を登録しました。`);
    
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
