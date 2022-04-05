const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { channels } = require('../src/shared/constants');
const { autoUpdater } = require('electron-updater');
const Connection = require('./services/connection');
const Database = require('./services/database');
const Settings = require('./services/settings');
const Auth = require('./services/auth');
const Table = require('./services/table');
const path = require('path');
const url = require('url');

let mainWindow;

let successful = {
  success: true,
  data: {}
};

let unsuccessful = {
  success: false,
  message: ""
};

function createWindow () {
  let startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:', //file:
    slashes: true
  });

  mainWindow = new BrowserWindow({
    show: false,
    width: 1366,
    height: 768,
    webPreferences: {
      NodeIntegration: true,
      javascript: true,
      plugins: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.once('ready-to-show', () => {
    //require('update-electron-app')();
    autoUpdater.checkForUpdatesAndNotify();
    mainWindow.show();
  });

  mainWindow.loadURL(startUrl);

  // Set/Remove devtools
  mainWindow.webContents.on("devtools-opened", () => {
      // mainWindow.closeDevTools();
  });

  // Set/Remove MENU
  mainWindow.removeMenu();

  mainWindow.on('closed', function () {
    app.quit();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on(channels.APP_INFO, (event) => {
  event.sender.send(channels.APP_INFO, {
    appName: app.getName(),
    appVersion: app.getVersion(),
  });
});

/**
 *  Auth
 */

ipcMain.on(channels.AUTH_LOGIN, async (event, email, password) => {
  try {
    const result = await Auth.login(email, password);
    successful.data = result;
    await event.sender.send(channels.AUTH_LOGIN, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.AUTH_LOGIN, unsuccessful);
  }
});

ipcMain.on(channels.AUTH_REGISTER, async (event, email, password, fullName, companyName) => {
  try {
    const result = await Auth.register(email, password, fullName, companyName);
    successful.data = result;
    await event.sender.send(channels.AUTH_REGISTER, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.AUTH_REGISTER, unsuccessful);
  }
});

ipcMain.on(channels.AUTH_VERIFY_TOKEN, async (event, id, token) => {
  try {
    const result = await Auth.verifyToken(id, token);
    successful.data = result;
    await event.sender.send(channels.AUTH_VERIFY_TOKEN, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.AUTH_VERIFY_TOKEN, unsuccessful);
  }
});

/**
 *  Connections
 */

ipcMain.on(channels.DELETE_CONNECTION, async (event, name) => {
  try {
    const result = await Connection.deleteConnection(name);
    successful.data = result;
    await event.sender.send(channels.DELETE_CONNECTION, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.DELETE_CONNECTION, unsuccessful);
  }
});

ipcMain.on(channels.ADD_CONNECTION, async (event, params) => {
  try {
    const result = await Connection.addConnection(params);
    successful.data = result;
    await event.sender.send(channels.ADD_CONNECTION, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.ADD_CONNECTION, unsuccessful);
  }
});

ipcMain.on(channels.RENAME_CONNECTION, async (event, connectionName, newConnectionName) => {
  try {
    const result = await Connection.renameConnection(connectionName, newConnectionName);
    successful.data = result;
    await event.sender.send(channels.RENAME_CONNECTION, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.RENAME_CONNECTION, unsuccessful);
  }
});

/**
 *  Databases
 */

ipcMain.on(channels.CREATE_DB, async (event) => {
  try {
    const result = await Database.createDefaultDatabase();
    successful.data = result;
    await event.sender.send(channels.CREATE_DB, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.CREATE_DB, unsuccessful);
  }
});

ipcMain.on(channels.LOAD_DB, async (event, encodedDatabase) => {
  try {
    const result = await Database.loadDatabase(encodedDatabase);
    successful.data = result;
    await event.sender.send(channels.LOAD_DB, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.LOAD_DB, unsuccessful);
  }
});

ipcMain.on(channels.GET_DB, async (event) => {
  try {
    const result = await Database.getDataFromDatabase();

    if (!result.connections) {
      await Database.createDefaultDatabase();
    }

    successful.data = result;
    console.log("DATA: ", successful.data);
    await event.sender.send(channels.GET_DB, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.GET_DB, unsuccessful);
  }
});

ipcMain.on(channels.SHARE_DB, async (event) => {
  try {
    const result = await Database.getDatabaseForTransport();
    successful.data = result;
    await event.sender.send(channels.SHARE_DB, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.SHARE_DB, unsuccessful);
  }
});

/**
 *  Settings
 */

ipcMain.on(channels.UPDATE_LANGUAGE, async (event, language) => {
  try {
    await Settings.updateLanguage(language);
    await event.sender.send(channels.UPDATE_LANGUAGE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.UPDATE_LANGUAGE, unsuccessful);
  }
});

ipcMain.on(channels.UPDATE_THEME, async (event, theme) => {
  try {
    await Settings.updateTheme(theme);
    await event.sender.send(channels.UPDATE_LANGUAGE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.UPDATE_LANGUAGE, unsuccessful);
  }
});

/**
 * Key
 */

ipcMain.on(channels.CHECK_LICENSE, async (event) => {
  try {
    const result = await Database.checkLicense();
    successful.data = result;
    console.log(result);
    await event.sender.send(channels.CHECK_LICENSE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.CHECK_LICENSE, unsuccessful);
  }
});

ipcMain.on(channels.SET_TRIAL, async (event) => {
  try {
    const result = await Database.setTrial();
    successful.data = result;
    await event.sender.send(channels.SET_TRIAL, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.SET_TRIAL, unsuccessful);
  }
});

ipcMain.on(channels.UPDATE_KEY, async(event, key) => {
  try {
    const result = await Database.updateKey(key);
    successful.data = result;
    await event.sender.send(channels.UPDATE_KEY, successful);
  } catch(e) {
    unsuccessful.message = e;
    await event.sender.send(channels.UPDATE_KEY, unsuccessful);
  }
});

/**
 *  Tables
 */

ipcMain.on(channels.GET_ALL_TABLES, async (event, connectionName) => {
  try {
    const result = await Table.getAllTables(connectionName);
    successful.data = result;
    await event.sender.send(channels.GET_ALL_TABLES, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.GET_ALL_TABLES, unsuccessful);
  }
});

ipcMain.on(channels.UPDATE_DEFAULT_TABLE_ROW, async (event, id, token, connectionName, alias, columnsAndValues) => {
  try {
    const result = await Table.updateDefaultTableRow(id, token, connectionName, alias, columnsAndValues);
    successful.data = result;
    await event.sender.send(channels.UPDATE_DEFAULT_TABLE_ROW, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.UPDATE_DEFAULT_TABLE_ROW, unsuccessful);
  }
});

ipcMain.on(channels.DELETE_DEFAULT_TABLE_ROW, async (event, id, token, connectionName, alias, columnsAndValues) => {
  try {
    const result = await Table.deleteDefaultTableRow(id, token, connectionName, alias, columnsAndValues);
    successful.data = result;
    await event.sender.send(channels.DELETE_DEFAULT_TABLE_ROW, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.DELETE_DEFAULT_TABLE_ROW, unsuccessful);
  }
});

ipcMain.on(channels.DELETE_TABLE, async (event, connectionName, alias) => {
  try {
    const result = await Table.deleteTable(connectionName, alias);
    successful.data = result;
    await event.sender.send(channels.DELETE_TABLE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.DELETE_TABLE, unsuccessful);
  }
});

ipcMain.on(channels.GET_TABLE, async (event, connectionName, alias) => {
  try {
    const result = await Table.getTable(connectionName, alias);
    successful.data = result;
    await event.sender.send(channels.GET_TABLE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.GET_TABLE, unsuccessful);
  }
});

ipcMain.on(channels.ADD_TABLE, async (event, connectionName, query, type, alias) => {
  try {
    const result = await Table.addTable(connectionName, query, type, alias);
    successful.data = result;
    await event.sender.send(channels.ADD_TABLE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.ADD_TABLE, unsuccessful);
  }
});

ipcMain.on(channels.RENAME_TABLE, async (event, connectionName, alias, newAlias) => {
  try {
    const result = await Table.renameTable(connectionName, alias, newAlias);
    successful.data = result;
    await event.sender.send(channels.RENAME_TABLE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.RENAME_TABLE, unsuccessful);
  }
});

ipcMain.on(channels.UPDATE_QUERY, async (event, connectionName, alias, newQuery, newAlias) => {
  try {
    const result = await Table.updateTableQuery(connectionName, alias, newQuery, newAlias);
    successful.data = result;
    await event.sender.send(channels.UPDATE_QUERY, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.UPDATE_QUERY, unsuccessful);
  }
});

ipcMain.on(channels.GET_TABLE_SIZE, async (event, connectionName, alias) => {
  try {
    const result = await Table.getTableSize(connectionName, alias);
    successful.data = result;
    await event.sender.send(channels.GET_TABLE_SIZE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.GET_TABLE_SIZE, unsuccessful);
  }
});

ipcMain.on(channels.LOAD_QUERY, async (event, connectionName, alias, options) => {
  try {
    const result = await Table.loadTableResult(connectionName, alias, options);
    successful.data = result;
    await event.sender.send(channels.LOAD_QUERY, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.LOAD_QUERY, unsuccessful);
  }
});

ipcMain.on(channels.SAVE_QUERY, async (event, connectionName, alias, options) => {
  try {
    const result = await Table.saveTableResult(connectionName, alias, options);
    successful.data = result;
    await event.sender.send(channels.SAVE_QUERY, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.SAVE_QUERY, unsuccessful);
  }
});

ipcMain.on(channels.TEST_QUERY, async (event, connectionName, query) => {
  try {
    const result = await Table.runQuery(connectionName, query);
    successful.data = result;
    await event.sender.send(channels.TEST_QUERY, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.TEST_QUERY, unsuccessful);
  }
});

ipcMain.on(channels.GET_TABLE_COLUMNS, async (event, connectionName, table) => {
  try {
    const result = await Table.getTableColumns(connectionName, table);
    successful.data = result;
    await event.sender.send(channels.GET_TABLE_COLUMNS, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.GET_TABLE_COLUMNS, unsuccessful);
  }
});

ipcMain.on(channels.SEARCH_BY_ALL_TABLES, async (event, connectionName, value) => {
  try {
    const result = await Table.searchByAllTables(connectionName, value);
    successful.data = result;
    await event.sender.send(channels.SEARCH_BY_ALL_TABLES, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.SEARCH_BY_ALL_TABLES, unsuccessful);
  }
});
