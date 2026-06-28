/**
 * 中央マスタ同期サービス
 * Layer 2: Application Service
 *
 * 月別スプレッドシート作成時に、中央マスタから以下をスナップショット転記する。
 * - 決済方法
 * - 固定費
 * - 利用者・承認者
 *
 * 依存:
 * - 00_config_constants.js (CONSTANTS)
 * - 00_infra_logger.js (AppLogger)
 */

/**
 * 中央マスタの内容を月別スプレッドシートへ同期する。
 * @param {string} spreadsheetId - 同期先の月別スプレッドシートID
 * @param {string} fileName - `YYYY年M月`形式の月別ファイル名
 */
function syncMasterDataToMonthlySpreadsheet(spreadsheetId, fileName) {
  const targetMonth = parseYearMonthKey_(fileName);
  const master = SpreadsheetApp.openById(CONSTANTS.MASTER_SPREADSHEET_ID);
  const target = SpreadsheetApp.openById(spreadsheetId);

  syncPaymentMethods_(master, target);
  syncUsers_(master, target);
  syncFixedCosts_(master, target, targetMonth);

  SpreadsheetApp.flush();
  AppLogger.info(`${fileName}へ中央マスタを同期しました。`);
}

/**
 * 決済方法一覧を集計シートへ同期する。
 */
function syncPaymentMethods_(master, target) {
  const sourceSheet = master.getSheetByName(CONSTANTS.MASTER_SHEETS.PAYMENT_METHOD);
  const targetSheet = target.getSheetByName(CONSTANTS.MONTHLY_SHEETS.SUMMARY);

  if (!sourceSheet || !targetSheet) {
    throw new Error("決済方法の同期対象シートが見つかりません。");
  }

  const lastRow = Math.max(sourceSheet.getLastRow(), 1);
  const values = sourceSheet
    .getRange(2, 1, Math.max(lastRow - 1, 1), 1)
    .getValues()
    .map(row => row[0])
    .filter(value => value !== "" && value !== null)
    .map(value => [value]);

  targetSheet.getRange("I4:I95").clearContent();
  if (values.length > 0) {
    targetSheet.getRange(4, 9, values.length, 1).setValues(values);
  }
}

/**
 * 利用者・承認者一覧をリストシートへ同期する。
 */
function syncUsers_(master, target) {
  const sourceSheet = master.getSheetByName(CONSTANTS.MASTER_SHEETS.USER);
  const targetSheet = target.getSheetByName(CONSTANTS.MONTHLY_SHEETS.LIST);

  if (!sourceSheet || !targetSheet) {
    throw new Error("利用者一覧の同期対象シートが見つかりません。");
  }

  const lastRow = Math.max(sourceSheet.getLastRow(), 1);
  const values = sourceSheet
    .getRange(2, 1, Math.max(lastRow - 1, 1), 3)
    .getValues()
    .filter(row => row.some(value => value !== "" && value !== null));

  targetSheet.getRange("B3:D1000").clearContent();
  if (values.length > 0) {
    targetSheet.getRange(3, 2, values.length, 3).setValues(values);
  }
}

/**
 * 対象月に有効な固定費を集計シートへ同期する。
 */
function syncFixedCosts_(master, target, targetMonth) {
  const sourceSheet = master.getSheetByName(CONSTANTS.MASTER_SHEETS.FIXED_COST);
  const targetSheet = target.getSheetByName(CONSTANTS.MONTHLY_SHEETS.SUMMARY);

  if (!sourceSheet || !targetSheet) {
    throw new Error("固定費の同期対象シートが見つかりません。");
  }

  const lastRow = Math.max(sourceSheet.getLastRow(), 2);
  const rows = sourceSheet
    .getRange(3, 1, Math.max(lastRow - 2, 1), 11)
    .getValues();

  const fixedCosts = rows
    .filter(row => row[0] === true)
    .filter(row => isMonthInRange_(targetMonth, row[8], row[9]))
    .filter(row => row[1] !== "" && row[3] !== "")
    .map(row => [row[1], Number(row[3])]);

  targetSheet.getRange("P4:Q991").clearContent();
  if (fixedCosts.length > 0) {
    targetSheet.getRange(4, 16, fixedCosts.length, 2).setValues(fixedCosts);
  }

  SpreadsheetApp.flush();

  const expectedTotal = fixedCosts.reduce((sum, row) => sum + row[1], 0);
  const actualTotal = Number(targetSheet.getRange("P3").getValue());
  if (actualTotal !== expectedTotal) {
    throw new Error(`固定費合計の検証に失敗しました。期待値=${expectedTotal}, 実際=${actualTotal}`);
  }
}

/**
 * `YYYY年M月`を比較用の数値YYYYMMへ変換する。
 */
function parseYearMonthKey_(fileName) {
  const match = String(fileName).match(/^(\d{4})年(\d{1,2})月$/);
  if (!match) {
    throw new Error(`月別ファイル名の形式が不正です: ${fileName}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`月の値が不正です: ${fileName}`);
  }

  return year * 100 + month;
}

/**
 * 適用開始月・終了月を考慮し、対象月に有効か判定する。
 */
function isMonthInRange_(targetMonth, startMonth, endMonth) {
  const startKey = parseOptionalMonthKey_(startMonth);
  const endKey = parseOptionalMonthKey_(endMonth);

  if (startKey !== null && targetMonth < startKey) {
    return false;
  }
  if (endKey !== null && targetMonth > endKey) {
    return false;
  }
  return true;
}

/**
 * `YYYY-MM`、日付、空欄を比較用の数値YYYYMMへ変換する。
 */
function parseOptionalMonthKey_(value) {
  if (value === "" || value === null) {
    return null;
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return value.getFullYear() * 100 + (value.getMonth() + 1);
  }

  const match = String(value).trim().match(/^(\d{4})[-\/]?(\d{1,2})$/);
  if (!match) {
    throw new Error(`適用月の形式が不正です: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`適用月の値が不正です: ${value}`);
  }

  return year * 100 + month;
}
