/**
 * スプレッドシートサービス
 * Google Spreadsheetの操作機能を提供
 */

/**
 * 現在の年月のスプレッドシートを取得する
 * @returns {SpreadsheetApp.Spreadsheet|null} スプレッドシートオブジェクトまたはnull
 */
function getCurrentMonthSpreadsheet() {
  try {
    const folderId = getProperty("FOLDER_ID");
    const fileName = getCurrentMonthFileName();
    
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileName);
    
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    } else {
      console.log(`${fileName}のスプレッドシートが見つかりませんでした。`);
      return null;
    }
  } catch (error) {
    console.error("getCurrentMonthSpreadsheet でエラーが発生しました:", error);
    return null;
  }
}

/**
 * カード利用情報をスプレッドシートに追加する
 * @param {Array<Array>} cardUsages - カード利用情報の配列
 */
function addPaymentInfoToSpreadsheet(cardUsages) {
  try {
    const spreadsheet = getCurrentMonthSpreadsheet();
    if (!spreadsheet) {
      console.error("スプレッドシートを取得できませんでした。");
      return;
    }
    
    const sheet = spreadsheet.getSheetByName(CONSTANTS.SHEET_NAME.EXPENSE_LIST);
    if (!sheet) {
      console.error("支出一覧シートが見つかりませんでした。");
      return;
    }
    
    const lastRow = sheet.getLastRow();
    const insertRow = lastRow + 1;
    
    sheet.getRange(insertRow, 1, cardUsages.length, cardUsages[0].length).setValues(cardUsages);
    console.log(`${cardUsages.length}件のカード利用情報を追加しました。`);
    
  } catch (error) {
    console.error("addPaymentInfoToSpreadsheet でエラーが発生しました:", error);
  }
}

/**
 * テンプレートファイルから新しいファイルを作成する
 * @param {DriveApp.Folder} folder - 対象フォルダ
 * @param {string} fileName - 作成するファイル名
 * @returns {string|null} 作成されたファイルのURLまたはnull
 */
function createFileFromTemplate(folder, fileName) {
  try {
    const templateFiles = folder.getFilesByName(CONSTANTS.TEMPLATE_FILE_NAME);
    if (!templateFiles.hasNext()) {
      console.log("テンプレートファイルが見つかりませんでした。");
      return null;
    }
    
    const template = templateFiles.next();
    const newFile = template.makeCopy(fileName, folder);
    console.log(`${fileName}を作成しました。`);
    
    return newFile.getUrl();
  } catch (error) {
    console.error("createFileFromTemplate でエラーが発生しました:", error);
    return null;
  }
}

/**
 * 来月のスプレッドシートが無い場合にテンプレートを複製して自動作成
 */
function copy_template_file() {
  try {
    const folderId = getProperty("FOLDER_ID");
    const nextMonthFileName = getNextMonthFileName();
    
    console.log(`来月のファイル名: ${nextMonthFileName}`);
    
    const folder = DriveApp.getFolderById(folderId);
    
    // 既存ファイルの確認
    if (isFileExists(folder, nextMonthFileName)) {
      console.log("来月のスプレッドシートは既に存在したので何もせず終了しました。");
      return;
    }
    
    // テンプレートファイルの複製
    const newFileUrl = createFileFromTemplate(folder, nextMonthFileName);
    if (newFileUrl) {
      const message = `${nextMonthFileName}のスプレッドシートを作成しました。以下のURLからアクセスできます。\n${newFileUrl}`;
      sendPost(message);
    }
    
  } catch (error) {
    console.error("copy_template_file でエラーが発生しました:", error);
    sendPost("スプレッドシートの作成中にエラーが発生しました。");
  }
}
