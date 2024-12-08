function getH3CellValueFromAllSpreadsheetsInFolder() {
  // 家計簿フォルダのIDを指定
  const folderId = "12pkf83illSCBi3JzoF2wy2jvRo32lkmF";

  // 貯金シートを取得
  const currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // 一度だけシートを削除するフラグ（削除済みならtrue）
  let sheetCleared = {};

  // フォルダ内のすべてのファイルを取得
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();

  // ソート用の配列を初期化
  let sortedSheets = [];

  // 日付を取得
  const now = new Date();
  const currentYear = now.getFullYear().toString();

  // 各ファイルを回す
  while (files.hasNext()) {
    let file = files.next();

    // 今見ているファイルがスプシかどうか確認
    if (file.getMimeType() === "application/vnd.google-apps.spreadsheet") {
      let spreadsheet = SpreadsheetApp.openById(file.getId());

      // 実行している都市以外はスキップ
      if (!spreadsheet.getName().includes(currentYear)) {
        continue;
      }

      // 年の取得
      var yearMatch = /(\d{4})年(\d{1,2})月/.exec(spreadsheet.getName());
      var startYear = yearMatch ? yearMatch[1] : null;
      var startMonth = yearMatch ? yearMatch[2] : null;

      if (startYear && startMonth) {
        // 年月を日付データに変換
        var startDate = new Date(startYear, startMonth - 1); // 月はゼロベースなので、1を引く

        // 年のシートを取得
        var yearSheet = currentSpreadsheet.getSheetByName(startYear);

        if (!yearSheet) {
          // 年のシートが存在しない場合はテンプレートを複製して新しいシートを作成
          var templateSheet = currentSpreadsheet.getSheetByName("テンプレート");
          var newSheet = templateSheet.copyTo(currentSpreadsheet);
          newSheet.setName(startYear);
          yearSheet = newSheet;

          // 一度だけシートを削除するフラグを設定
          sheetCleared[startYear] = false;
        }

        // 一度だけシートの内容を削除
        if (!sheetCleared[startYear]) {
          clearSheetContent(yearSheet);
          sheetCleared[startYear] = true; // フラグをリセット
        }

        // 特定のシートを取得（ここでは1番目のシートを対象としています）
        var sheet = spreadsheet.getSheets()[1];
        var h4Value = sheet.getRange("H3").getValue();

        // ソート用のオブジェクトに情報を格納
        sortedSheets.push({
          date: startDate,
          name: spreadsheet.getName(),
          value: h4Value
        });
      }
    }
  }

  // 日付で降順ソート
  sortedSheets.sort(function(a, b) {
    return b.date - a.date;
  });

  // ソートされた情報を元にシートに追加
  for (var i = 0; i < sortedSheets.length; i++) {
    var sortedSheet = sortedSheets[i];
    var yearSheet = currentSpreadsheet.getSheetByName(sortedSheet.date.getFullYear().toString());
    yearSheet.appendRow([Utilities.formatDate(sortedSheet.date, "JST", "yyyy年MM月"), sortedSheet.value]);
    console.log("スプレッドシート：" + sortedSheet.name + "　　貯金額：" + sortedSheet.value + "円");
  }

  // F1セルに最終更新日時を記録
  updateTimestampForAllSheets(currentSpreadsheet);
}


function clearSheetContent(sheet) {
  // A列とB列の２行目以降のセルの値を削除
  var lastRow = sheet.getLastRow();
  if (lastRow > 2) {  // 2行目以降が存在する場合
    sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }
}

function updateTimestampForAllSheets(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  var now = new Date();
  var formattedDate = Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

  for (var i = 0; i < sheets.length; i++) {
    sheets[i].getRange("F1").setValue(formattedDate);
  }
}

// 来月のスプレッドシートが無い場合にテンプレートを複製して自動作成
function copy_template_file() {
  folderId = "12pkf83illSCBi3JzoF2wy2jvRo32lkmF";

  // 現在の日付を取得
  var now = new Date();
  // 現在の年月を取得
  var currentYear = now.getFullYear();
  var currentMonth = now.getMonth() + 1; // 月は0から始まるため1を加える
  // 来月の年月を取得
  var nextMonthDate = new Date(currentYear, currentMonth, 1);
  var nextYear = nextMonthDate.getFullYear();
  var nextMonth = nextMonthDate.getMonth() + 1; // 月は0から始まるため1を加える

  // ファイル名を作成
  var fileName = nextYear + "年" + nextMonth + "月";
  console.log(fileName);

  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    console.log("来月のスプレッドシートは既に存在したので何もせず終了しました。");
  } else {
    console.log("指定されたファイルが見つからないのでテンプレートファイルを複製します。");
    var templateFiles = folder.getFilesByName("テンプレート");
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

// 現在の年月に対応するスプレッドシートを取得し家計簿情報（予算や支出）をLINEに通知する
function line_bot() {
  var folderId = "12pkf83illSCBi3JzoF2wy2jvRo32lkmF";

  // 現在の日付を取得
  var now = new Date();
  fileName = Utilities.formatDate(now, "Asia/Tokyo", "yyyy年M月");
  console.log(fileName);

  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    var file = files.next();
    var spreadsheet = SpreadsheetApp.openById(file.getId());
    var sheet = spreadsheet.getSheetByName("集計");
    if (sheet) {
      var result = {};
      result.L3 = sheet.getRange('L3').getValue();
      result.D3 = sheet.getRange('D3').getValue();
      result.E3 = sheet.getRange('E3').getValue();
      result.H3 = sheet.getRange('H3').getValue();

      // 数値を金額表示に変換
      result.L3 = convertToCurrencyFormat(result.L3);
      result.D3 = convertToCurrencyFormat(result.D3);
      result.E3 = convertToCurrencyFormat(result.E3);
      result.H3 = convertToCurrencyFormat(result.H3);
      
      content = "\n" + fileName + "の家計簿情報\n収入は " + result.L3 + "円\n予算は " + result.D3 + "円\n支出は " + result.E3 + "円\n差分（収入-支出)は " + result.H3 + "円\nです";

      sendPost(content);
      
    } else {
      console.log("指定されたシートが見つかりませんでした。");
    }
  } else {
    console.log("指定されたファイルが見つかりませんでした。");
  }
}

// 引数（content）に渡された文字列を家計簿通知botに送信する
function sendPost(content) {
  // pushメッセージURL
  const push = 'https://api.line.me/v2/bot/message/broadcast';
  // LINE Messaging APIのアクセストークン
  const token = "v4+O88cqtU0iIx4jb1GJ0r0UubhXi3z8Rp2ydsAEUDW829vBZEr2u+ogeZ+yo4FtQhbGc3sBJfP3iHnzSH5m+A22ZLLAH95i1NiNNCN/ku2ZlDlmwus8BnQYMS51Jg6WK++T51FvYuewUn/Tvs3Z3QdB04t89/1O/w1cDnyilFU=";

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

// 指定された数値を金額表示に変換する
function convertToCurrencyFormat(number) {
  return Number(number).toLocaleString('ja-JP');
}


// メールからカード利用情報を取得する
function getCardUsageInfoFromMail() {
  // 前日の日付範囲を設定
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const testTime = new Date(2024, 10, 7, 0, 0, 0);
  
  // 日付をYYYY/MM/DD形式に変換
  const formattedDate = Utilities.formatDate(testTime, 'Asia/Tokyo', 'yyyy/MM/dd');
  // const formattedDate = Utilities.formatDate(yesterday, 'Asia/Tokyo', 'yyyy/MM/dd');
  
  // メール検索条件を設定
  const searchQuery = `subject:"【三菱UFJ-JCBデビット】ご利用のお知らせ" after:${formattedDate}`;

  // メールを検索
  const threads = GmailApp.search(searchQuery);
  const cardUsages = [];

  // 各メールから情報を抽出
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const body = message.getPlainBody();
      
      // 正規表現パターンを修正
      const dateTimeMatch = body.match(/【ご利用日時\(日本時間\)】　(\d{4}年\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2})/);
      const amountMatch = body.match(/【ご利用金額】　([0-9,]+)円/);
      const storeMatch = body.match(/【ご利用先】　(.+?)(?:\r?\n)/);

      if (dateTimeMatch && amountMatch && storeMatch) {
        // 日付文字列を Date オブジェクトに変換し、スプレッドシート用にフォーマット
        const dateStr = dateTimeMatch[1];  // 例: "2024年3月15日 15:30"
        const date = new Date(dateStr.replace(/年|月/g, '/').replace(/日/g, ''));
        const formattedDate = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd');

        cardUsages.push([
          "",
          "",
          amountMatch[1].replace(/,/g, ''),
          storeMatch[1].trim(),
          "",
          "",
          "",
          "",
          "三菱UFJ-JCBデビット",
          "ゆう",
          formattedDate,  // フォーマットされた日付を使用
        ]);
      }
    });
  });

  addPaymentInfoToSpreadsheet(cardUsages);
}

// 現在の年月のスプレッドシートを取得する
function getCurrentMonthSpreadsheet() {
  // 家計簿フォルダのID
  const folderId = "12pkf83illSCBi3JzoF2wy2jvRo32lkmF";
  
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

// カード利用情報をスプレッドシートに追加する
function addPaymentInfoToSpreadsheet(cardUsages) {
  const spreadsheet = getCurrentMonthSpreadsheet();
  const sheet = spreadsheet.getSheetByName("支出一覧");
  const lastRow = sheet.getLastRow();
  const insertRow = lastRow + 1;  // 最終行の次の行に挿入

  sheet.getRange(insertRow, 1, cardUsages.length, cardUsages[0].length).setValues(cardUsages);
}












