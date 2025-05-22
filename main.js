/** @const {string} 家計簿関連のファイルが格納されているGoogle DriveのフォルダID */
const FOLDER_ID = "12pkf83illSCBi3JzoF2wy2jvRo32lkmF";
/** @const {string} 新しい年次集計シートを作成する際のテンプレートとなるシート名 */
const TEMPLATE_SHEET_NAME = "テンプレート";
/** @const {string} 各月のスプレッドシート内で集計データが記載されているシート名 */
const SUMMARY_SHEET_NAME = "集計";
/** @const {string} 各月のスプレッドシート内で支出一覧データが記載されているシート名 */
const EXPENSE_SHEET_NAME = "支出一覧";

/**
 * 指定されたフォルダ内のすべての月次家計簿スプレッドシートからH3セルの値を集計し、
 * 年次集計シートに記録します。
 * 年次集計シートが存在しない場合は、テンプレートから新しく作成します。
 * 各年次シートのA列とB列の内容は、処理の開始時に一度クリアされます。
 * 最後に、すべてのシートのF1セルに最終更新日時を記録します。
 */
function getH3CellValueFromAllSpreadsheetsInFolder() {
  const currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheetCleared = {};
  const files = DriveApp.getFolderById(FOLDER_ID).getFiles();
  let allSheetData = [];

  const globalConsts = {
    FOLDER_ID: FOLDER_ID,
    TEMPLATE_SHEET_NAME: TEMPLATE_SHEET_NAME,
    SUMMARY_SHEET_NAME: SUMMARY_SHEET_NAME,
    EXPENSE_SHEET_NAME: EXPENSE_SHEET_NAME
  };

  while (files.hasNext()) {
    let file = files.next();
    const monthlyData = _extractDataFromMonthlySheet(file);

    if (monthlyData) {
      const yearSheetResult = _getOrCreateYearSheet(currentSpreadsheet, monthlyData.startYear, globalConsts.TEMPLATE_SHEET_NAME, globalConsts);
      let yearSheet = yearSheetResult.sheet;

      if (yearSheetResult.newlyCreated || !sheetCleared[monthlyData.startYear]) {
        clearSheetContent(yearSheet);
        sheetCleared[monthlyData.startYear] = true;
      }
      allSheetData.push(monthlyData);
    }
  }

  const sortedData = _sortSheetData(allSheetData);

  for (var i = 0; i < sortedData.length; i++) {
    var dataItem = sortedData[i];
    // Ensure we are populating to the correct year sheet, potentially re-fetching it if necessary,
    // though _getOrCreateYearSheet would have already created it.
    var yearSheet = currentSpreadsheet.getSheetByName(dataItem.startYear.toString());
    if(yearSheet) { // Check if sheet exists, it should at this point.
      _populateSummarySheet(yearSheet, dataItem);
    } else {
      console.error("Year sheet " + dataItem.startYear + " not found for populating data for " + dataItem.name);
    }
  }

  updateTimestampForAllSheets(currentSpreadsheet);
}

/**
 * 月次スプレッドシートファイルからデータを抽出します。
 * ファイルが当年のものでない場合、または必要な情報（年、月、H3セルの値）が
 * 取得できない場合はnullを返します。
 * @param {GoogleAppsScript.Drive.File} file 処理対象のGoogle Drive上のファイルオブジェクト。
 * @return {?{date: Date, name: string, value: *, startYear: string}} 抽出されたデータオブジェクト、またはnull。
 *                                                                   オブジェクトには、日付、スプレッドシート名、H3セルの値、年が含まれます。
 * @private
 */
function _extractDataFromMonthlySheet(file) {
  const currentYear = new Date().getFullYear().toString();
  if (file.getMimeType() === "application/vnd.google-apps.spreadsheet") {
    let spreadsheet = SpreadsheetApp.openById(file.getId());
    if (!spreadsheet.getName().includes(currentYear)) {
      return null;
    }

    var yearMatch = /(\d{4})年(\d{1,2})月/.exec(spreadsheet.getName());
    var startYear = yearMatch ? yearMatch[1] : null;
    var startMonth = yearMatch ? yearMatch[2] : null;

    if (startYear && startMonth) {
      var startDate = new Date(startYear, startMonth - 1); // Month is zero-based
      var sheet = spreadsheet.getSheets()[1]; // Assuming data is on the second sheet
      var h3Value = sheet.getRange("H3").getValue(); // Corrected variable name
      return {
        date: startDate,
        name: spreadsheet.getName(),
        value: h3Value, // Corrected variable name
        startYear: startYear
      };
    }
  }
  return null;
}

/**
 * 指定された年に対する年次集計シートを取得または作成します。
 * シートが存在しない場合は、指定されたテンプレートシート名に基づいて新しいシートを作成します。
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} currentSpreadsheet 現在アクティブなスプレッドシート（年次集計を格納するスプレッドシート）。
 * @param {string} year 作成または取得する年次集計シートの年（例: "2023"）。
 * @param {string} templateSheetName 新規作成時に使用するテンプレートシートの名前。
 * @param {object} globalConsts グローバル定数を含むオブジェクト (この関数内では未使用だが、一貫性のために引数に含まれる)。
 * @return {{sheet: GoogleAppsScript.Spreadsheet.Sheet, newlyCreated: boolean}} 取得または作成されたシートオブジェクトと、新規作成されたかどうかを示すフラグのオブジェクト。
 * @private
 */
function _getOrCreateYearSheet(currentSpreadsheet, year, templateSheetName, globalConsts) {
  var yearSheet = currentSpreadsheet.getSheetByName(year);
  if (!yearSheet) {
    var templateSheet = currentSpreadsheet.getSheetByName(templateSheetName); // templateSheetName is already globalConsts.TEMPLATE_SHEET_NAME
    var newSheet = templateSheet.copyTo(currentSpreadsheet);
    newSheet.setName(year);
    yearSheet = newSheet;
    return {sheet: yearSheet, newlyCreated: true};
  }
  return {sheet: yearSheet, newlyCreated: false};
}

/**
 * 抽出されたシートデータの配列を日付の降順（新しいものが先頭）にソートします。
 * @param {Array<{date: Date, name: string, value: *, startYear: string}>} data ソート対象のシートデータオブジェクトの配列。
 * @return {Array<{date: Date, name: string, value: *, startYear: string}>} ソートされたシートデータオブジェクトの配列。
 * @private
 */
function _sortSheetData(data) {
  return data.sort(function(a, b) {
    return b.date - a.date;
  });
}

/**
 * ソートされた個々のデータアイテムを年次集計シートに追加します。
 * 同時に、処理内容をログに出力します。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} yearSheet データを追加する年次集計シート。
 * @param {{date: Date, name: string, value: *, startYear: string}} dataItem 追加するデータアイテム。
 * @private
 */
function _populateSummarySheet(yearSheet, dataItem) {
  yearSheet.appendRow([Utilities.formatDate(dataItem.date, "JST", "yyyy年MM月"), dataItem.value]);
  console.log("スプレッドシート：" + dataItem.name + "　　貯金額：" + dataItem.value + "円");
}

/**
 * 現在の日付情報を取得し、必要な形式で返します。
 * これには、当年、当月、来月の日付、来年、来月、およびそれらを特定の書式で整形した文字列が含まれます。
 * @return {{
 *   currentYear: number,
 *   currentMonth: number,
 *   nextMonthDate: Date,
 *   nextYear: number,
 *   nextMonth: number,
 *   formattedCurrentYearMonth: string,
 *   formattedNextYearMonth: string
 * }} 現在の日付情報を含むオブジェクト。
 * @private
 */
function _getCurrentDateInfo() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

  const nextMonthDate = new Date(currentYear, currentMonth, 1); // currentMonth is already +1, so it's correct for next month's 0-indexed month
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth() + 1; // getMonth() is 0-indexed

  return {
    currentYear: currentYear,
    currentMonth: currentMonth,
    nextMonthDate: nextMonthDate,
    nextYear: nextYear,
    nextMonth: nextMonth,
    formattedCurrentYearMonth: currentYear + "年" + currentMonth + "月",
    formattedNextYearMonth: nextYear + "年" + nextMonth + "月"
  };
}

/**
 * 指定されたシートの2行目以降のA列とB列の内容をクリアします。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet クリア対象のシート。
 */
function clearSheetContent(sheet) {
  // A列とB列の２行目以降のセルの値を削除
  var lastRow = sheet.getLastRow();
  if (lastRow > 2) {  // 2行目以降が存在する場合
    sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }
}

/**
 * 指定されたスプレッドシート内のすべてのシートのF1セルに、現在のタイムスタンプを記録します。
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet タイムスタンプを記録するスプレッドシート。
 */
function updateTimestampForAllSheets(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  var now = new Date();
  var formattedDate = Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

  for (var i = 0; i < sheets.length; i++) {
    sheets[i].getRange("F1").setValue(formattedDate);
  }
}

/**
 * 来月の家計簿スプレッドシートがまだ存在しない場合に、
 * テンプレートファイルから新しいスプレッドシートを複製して作成します。
 * 作成後、LINEに通知します。
 */
function copy_template_file() {
  const dateInfo = _getCurrentDateInfo();
  const fileName = dateInfo.formattedNextYearMonth;
  console.log(fileName);

  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    console.log("来月のスプレッドシートは既に存在したので何もせず終了しました。");
  } else {
    console.log("指定されたファイルが見つからないのでテンプレートファイルを複製します。");
    var templateFiles = folder.getFilesByName(TEMPLATE_SHEET_NAME);
    if (templateFiles.hasNext()) {
      template = templateFiles.next();
      var newFile = template.makeCopy(fileName, folder);

      // 新しく作成されたファイルのURLを取得
      var fileUrl = newFile.getUrl();

      // URL添付しLINEに通知
      sendPost(fileName + "のスプレッドシートを作成しました。以下のURLからアクセスできます。\n" + fileUrl);
    } else {
      console.log("テンプレートファイルが見つかりませんでした。");
    }
  }
}

/**
 * 現在の年月に対応する家計簿スプレッドシートを取得し、
 * その集計シートから収入、予算、支出、差分（予算-支出）の情報を取得してLINEに通知します。
 */
function line_bot() {
  const dateInfo = _getCurrentDateInfo();
  const fileName = dateInfo.formattedCurrentYearMonth;
  console.log(fileName);

  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    var file = files.next();
    var spreadsheet = SpreadsheetApp.openById(file.getId());
    var sheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME);
    if (sheet) {
      var result = {};
      result.L3 = sheet.getRange('L3').getValue();
      result.D3 = sheet.getRange('D3').getValue();
      result.E3 = sheet.getRange('E3').getValue();
      result.G3 = sheet.getRange('G3').getValue();

      // 数値を金額表示に変換
      result.L3 = convertToCurrencyFormat(result.L3);
      result.D3 = convertToCurrencyFormat(result.D3);
      result.E3 = convertToCurrencyFormat(result.E3);
      result.G3 = convertToCurrencyFormat(result.G3);
      
      content = fileName + "の家計簿情報\n収入は " + result.L3 + "円\n予算は " + result.D3 + "円\n支出は " + result.E3 + "円\n差分（予算-支出)は " + result.G3 + "円\nです";

      sendPost(content);
      
    } else {
      console.log("指定されたシートが見つかりませんでした。");
    }
  } else {
    console.log("指定されたファイルが見つかりませんでした。");
  }
}

// Make sure to set the 'LINE_ACCESS_TOKEN' script property in Project Settings > Script Properties.
/**
 * 指定された文字列メッセージをLINE Botを通じてブロードキャスト送信します。
 * LINEアクセストークンはスクリプトプロパティから取得します。
 * @param {string} content 送信するメッセージ内容。
 */
function sendPost(content) {
  // pushメッセージURL
  const push = 'https://api.line.me/v2/bot/message/broadcast';
  // LINE Messaging APIのアクセストークン
  const token = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');

  UrlFetchApp.fetch(push, {
    method: 'post',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    },
    payload: JSON.stringify({
        messages: [
            {
                type: 'text',
                text: content
            }
        ]
    })
});
}

/**
 * 指定された数値を日本の通貨形式（例: "1,234"）に変換します。
 * @param {number|string} number 変換する数値または数値文字列。
 * @return {string} 通貨形式に変換された文字列。
 */
function convertToCurrencyFormat(number) {
  return Number(number).toLocaleString('ja-JP');
}


/**
 * Gmailから指定された条件に一致するメールを検索し、カード利用情報を抽出して
 * スプレッドシートの支出一覧に追加します。
 * 処理後、LINEに通知します。
 * @param {{
 *   subject: string,
 *   regTime: RegExp,
 *   regAmount: RegExp,
 *   regStore: RegExp,
 *   cardType: string,
 *   transactionType: string
 * }} config カード情報抽出のための設定オブジェクト。
 *   - subject: 検索対象のメール件名。
 *   - regTime: 利用日時を抽出する正規表現。
 *   - regAmount: 利用金額を抽出する正規表現。
 *   - regStore: 利用店舗を抽出する正規表現。
 *   - cardType: カードの種類（例: "三菱カード"）。
 *   - transactionType: 取引の種類（例: "出金", "入金"）。
 */
function getCardUsageInfoFromMail(config) {
  // 前日の日付範囲を設定
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 日付をYYYY/MM/DD形式に変換
  const formattedDate = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyy/MM/dd');
  
  // メール検索条件を設定
  const searchQuery = `subject:${config.subject} after:${formattedDate}`;

  // メールを検索
  const threads = GmailApp.search(searchQuery);
  const cardUsages = [];

  if (threads.length === 0) {
    Logger.log(`（${config.cardType} ${config.transactionType}）カード利用情報はありませんでした。`);
    return;
  }

  // 各メールから情報を抽出
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const body = message.getPlainBody();
      
      // 正規表現パターンを使用
      const dateTimeMatch = body.match(config.regTime);
      const amountMatch = body.match(config.regAmount);
      if (config.transactionType === "入金") {
        // Ensure amountMatch and amountMatch[1] are not null before assignment
        if (amountMatch && amountMatch[1]) {
          amountMatch[1] = `-${amountMatch[1]}`;
        }
      }
      const storeMatch = body.match(config.regStore);

      if (dateTimeMatch && amountMatch && storeMatch) {
        // 日付文字列を Date オブジェクトに変換し、スプレッドシート用にフォーマット
        const dateStr = dateTimeMatch[1];  // 例: "2024年3月15日 15:30"
        const date = new Date(dateStr.replace(/年|月/g, '/').replace(/日/g, ''));
        const formattedSheetDate = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd');

        cardUsages.push([
          "",
          "",
          amountMatch[1].replace(/,/g, ''),
          storeMatch[1].trim(),
          "",
          "",
          "",
          "",
          config.cardType,
          "ゆう", // This seems to be a hardcoded user name
          formattedSheetDate,
          "GASにより自動登録"
        ]);
      } else {
        Logger.log("情報が見つかりませんでした。メール内容を確認してください。 Subject: " + config.subject);
      }
    });
  });

  if (cardUsages.length === 0) {
    // カード利用情報がない場合はログに出力
    Logger.log(`（${config.cardType} ${config.transactionType}）カード利用情報はありませんでした。（検索条件: ${searchQuery}）`);
    return;
  } else {
    addPaymentInfoToSpreadsheet(cardUsages);
    sendPost(`（${config.cardType} ${config.transactionType}）カード利用情報を登録しました。`);
  }
}

/**
 * 事前に定義された複数のカード設定に基づいて、各カードの利用情報をメールから取得し処理します。
 * `getCardUsageInfoFromMail` 関数を各設定で呼び出します。
 */
function mainGetCardUsageInfoFromMail() {
  const cardConfigs = [
    {
      subject: "【三菱UFJ-JCBデビット】ご利用のお知らせ",
      regTime: /【ご利用日時\(日本時間\)】　(\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2})/,
      regAmount: /【ご利用金額】　(-?[0-9,]+)円/,
      regStore: /【ご利用先】　([^\r\n]+)/,
      cardType: "三菱カード",
      transactionType: "出金"
    },
    {
      subject: "ご利用のお知らせ【三井住友カード】",
      regTime: /◇利用日[\s　]*：(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2})/,
      regAmount: /◇利用金額：(-?[0-9,]+)円/,
      regStore: /◇利用先[\s　]*：([^\r\n]+)/,
      cardType: "三井住友カード",
      transactionType: "出金"
    },
    {
      subject: "【三井住友銀行】振込入金のお知らせ",
      regTime: /入金日[\s　]*：[\s　]*(\d{4}年\d{1,2}月\d{1,2}日)/,
      regAmount: /金額[\s　]*：[\s　]*(-?[0-9,]+)円/,
      regStore: /内容[\s　]*：[\s　]*([^\r\n]+)/,
      cardType: "三井住友カード",
      transactionType: "入金"
    }
  ];

  for (const config of cardConfigs) {
    getCardUsageInfoFromMail(config);
  }
}

/**
 * 現在の年月に対応する家計簿スプレッドシートを取得します。
 * ファイル名は "YYYY年M月" の形式で期待されます。
 * @return {?GoogleAppsScript.Spreadsheet.Spreadsheet} 見つかった場合はスプレッドシートオブジェクト、見つからない場合はnull。
 */
function getCurrentMonthSpreadsheet() {
  // 家計簿フォルダのID
  const folderId = FOLDER_ID;
  
  // 現在の日付を取得してフォーマット（例：2024年3月）
  const now = new Date();
  const fileName = Utilities.formatDate(now, "Asia/Tokyo", "yyyy年M月");
  
  // フォルダを取得
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName(fileName);
  
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  } else {
    console.log(`${fileName}のスプレッドシートが見つかりませんでした。`);
    return null;
  }
}

/**
 * 抽出された複数のカード利用情報を、現在の月のスプレッドシートの「支出一覧」シートに追加します。
 * @param {Array<Array<string>>} cardUsages 追加するカード利用情報の二次元配列。各内部配列は1行分のデータに相当します。
 */
function addPaymentInfoToSpreadsheet(cardUsages) {
  const spreadsheet = getCurrentMonthSpreadsheet();
  const sheet = spreadsheet.getSheetByName(EXPENSE_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  const insertRow = lastRow + 1;  // 最終行の次の行に挿入

  sheet.getRange(insertRow, 1, cardUsages.length, cardUsages[0].length).setValues(cardUsages);
}












