/**
 * スプレッドシート操作サービス
 * Layer 2: Application Service
 *
 * Google SpreadsheetおよびGoogle Driveの操作機能を提供
 *
 * 依存:
 * - 00_config_constants.js (CONSTANTS)
 * - 00_infra_properties.js (getProperty)
 * - 00_infra_logger.js (AppLogger)
 * - 10_domain_dateUtils.js (getNextMonthFileName)
 * - 20_service_masterData.js (syncMasterDataToMonthlySpreadsheet)
 */

/**
 * ファイルが存在するかチェックする
 * @param {DriveApp.Folder} folder - 検索対象フォルダ
 * @param {string} fileName - ファイル名
 * @returns {boolean} ファイルが存在するかどうか
 */
function isFileExists(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  return files.hasNext();
}

/**
 * テンプレートファイルから新しいファイルを作成し、中央マスタを同期する
 * @param {DriveApp.Folder} folder - 対象フォルダ
 * @param {string} fileName - 作成するファイル名
 * @returns {string|null} 作成されたファイルのURLまたはnull
 */
function createFileFromTemplate(folder, fileName) {
  let newFile = null;

  try {
    const templateFiles = folder.getFilesByName(CONSTANTS.TEMPLATE_FILE_NAME);
    if (!templateFiles.hasNext()) {
      AppLogger.info("テンプレートファイルが見つかりませんでした。");
      return null;
    }

    const template = templateFiles.next();
    newFile = template.makeCopy(fileName, folder);
    AppLogger.info(`${fileName}を作成しました。`);

    // テンプレートは構造のみを複製し、マスタ値は作成時点の内容を転記する。
    syncMasterDataToMonthlySpreadsheet(newFile.getId(), fileName);

    return newFile.getUrl();
  } catch (error) {
    AppLogger.error("createFileFromTemplate でエラーが発生しました:", error);

    // マスタ同期に失敗した不完全な月別ファイルを残さない。
    if (newFile) {
      try {
        newFile.setTrashed(true);
        AppLogger.info(`${fileName}をゴミ箱へ移動しました。`);
      } catch (trashError) {
        AppLogger.error("不完全なファイルをゴミ箱へ移動できませんでした:", trashError);
      }
    }

    return null;
  }
}

/**
 * 来月のスプレッドシートを作成する（結果オブジェクトを返す）
 * ※通知ロジックは呼び出し側で行う
 * @returns {Object} 処理結果 { success: boolean, fileUrl: string|null, fileName: string, message: string }
 */
function createNextMonthSpreadsheetFile() {
  try {
    const folderId = getProperty("FOLDER_ID");
    const nextMonthFileName = getNextMonthFileName();

    AppLogger.info(`来月のファイル名: ${nextMonthFileName}`);

    const folder = DriveApp.getFolderById(folderId);

    // 既存ファイルの確認
    if (isFileExists(folder, nextMonthFileName)) {
      AppLogger.info("来月のスプレッドシートは既に存在します。");
      return {
        success: false,
        fileUrl: null,
        fileName: nextMonthFileName,
        message: "来月のスプレッドシートは既に存在したので何もせず終了しました。"
      };
    }

    // テンプレートファイルを複製し、中央マスタを同期
    const newFileUrl = createFileFromTemplate(folder, nextMonthFileName);
    if (newFileUrl) {
      return {
        success: true,
        fileUrl: newFileUrl,
        fileName: nextMonthFileName,
        message: `${nextMonthFileName}のスプレッドシートを作成しました。`
      };
    } else {
      return {
        success: false,
        fileUrl: null,
        fileName: nextMonthFileName,
        message: "スプレッドシートの作成または中央マスタの同期に失敗しました。"
      };
    }

  } catch (error) {
    AppLogger.error("createNextMonthSpreadsheetFile でエラーが発生しました:", error);
    return {
      success: false,
      fileUrl: null,
      fileName: "",
      message: "スプレッドシートの作成中にエラーが発生しました。"
    };
  }
}
