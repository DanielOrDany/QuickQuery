const { app, BrowserWindow, ipcMain } = require('electron');
const { channels } = require('../src/shared/constants');
const Connection = require('./services/connection');
const Database = require('./services/database');
const Settings = require('./services/settings');
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
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:', //file:
    slashes: true
  });

  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(startUrl);

  // mainWindow.on('closed', function () {
  //   mainWindow = null;
  // });
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

ipcMain.on(channels.APP_INFO, (event) => {
  event.sender.send(channels.APP_INFO, {
    appName: app.getName(),
    appVersion: app.getVersion(),
  });
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

ipcMain.on(channels.ADD_CONNECTION, async (event, name, host, port, user, password, database, schema, dtype) => {
  try {
    const result = await Connection.addConnection(name, host, port, user, password, database, schema, dtype);
    successful.data = result;
    await event.sender.send(channels.ADD_CONNECTION, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.ADD_CONNECTION, unsuccessful);
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

    if (!result.Connections) {
      await Database.createDefaultDatabase();
    }

    successful.data = result;
    console.log("DATA: ", result);
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
    await Table.renameTable(connectionName, alias, newAlias);
    await event.sender.send(channels.RENAME_TABLE, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.RENAME_TABLE, unsuccessful);
  }
});

ipcMain.on(channels.UPDATE_QUERY, async (event, connectionName, alias, query) => {
  try {
    await Table.updateTableQuery(connectionName, alias, query);
    await event.sender.send(channels.UPDATE_QUERY, successful);
  } catch (e) {
    unsuccessful.message = e;
    await event.sender.send(channels.UPDATE_QUERY, unsuccessful);
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