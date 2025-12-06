/**
 * カード設定定義
 * Layer 1: Domain
 *
 * 対応するカード・銀行の設定を一元管理
 *
 * 依存: なし
 */

/**
 * カード利用情報の設定定義
 * 新しいカードを追加する場合は、ここに設定を追加するだけでOK
 */
const CARD_CONFIGS = {
  /**
   * 三菱UFJ-JCBデビットカード
   */
  MUFG_JCB_DEBIT: {
    subject: "【三菱UFJ-JCBデビット】ご利用のお知らせ",
    regTime: /【ご利用日時\(日本時間\)】　(\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2})/,
    regAmount: /【ご利用金額】　(-?[0-9,]+)円/,
    regStore: /【ご利用先】　([^\r\n]+)/,
    cardType: "三菱カード",
    transactionType: "出金"
  },

  /**
   * 三井住友カード
   */
  SUMITOMO_CARD: {
    subject: "ご利用のお知らせ【三井住友カード】",
    regTime: /◇利用日[\s　]*：(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2})/,
    regAmount: /◇利用金額：(-?[0-9,]+)円/,
    regStore: /◇利用先[\s　]*：([^\r\n]+)/,
    cardType: "三井住友カード",
    transactionType: "出金"
  },

  /**
   * 三井住友銀行 振込入金
   */
  SUMITOMO_BANK_TRANSFER: {
    subject: "【三井住友銀行】振込入金のお知らせ",
    regTime: /入金日[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)/,
    regAmount: /金額[\s　]*：[\s　]*(-?[0-9,]+)円/,
    regStore: /内容[\s　]*：[\s　]*([^\r\n]+)/,
    cardType: "三井住友カード",
    transactionType: "入金"
  },

  /**
   * 三井住友銀行 口座出金
   */
  SUMITOMO_SHUKKIN: {
    subject: "【三井住友銀行】口座出金のお知らせ",
    regTime: /出金日[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)/,
    regAmount: /出金額[\s　]*：[\s　]*(-?[0-9,]+)円/,
    regStore: /内容[\s　]*：[\s　]*([^\r\n]+)/,
    cardType: "三井住友カード",
    transactionType: "出金"
  },

  /**
   * 三井住友銀行 振込受付完了（ネットバンキング）
   * ※金額はメールから取得できないため空で登録
   */
  SUMITOMO_FURIKOMI_SHUKKIN: {
    subject: "【三井住友銀行】振込受付完了のお知らせ",
    regTime: /受付日時[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)[\s　]*\d{1,2}時[\s　]*\d{1,2}分/,
    regAmount: null,
    regStore: "インターネットバンキングによる振込",
    cardType: "三井住友カード",
    transactionType: "出金"
  }
};
