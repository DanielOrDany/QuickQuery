const { channels } = require('../../../src/shared/constants');
const { ipcRenderer } = window;

// Export API methods
export const

    getDataFromDatabase = async () => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.GET_DB);
            ipcRenderer.on(channels.GET_DB, (event, result) => {
                resolve(result.data);
            });
        });
    },

    getTableColumns = async (connectionName, table) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.GET_TABLE_COLUMNS, connectionName, table);
            ipcRenderer.on(channels.GET_TABLE_COLUMNS, (event, result) => {
                resolve(result.data);
            });
        });
    },

    exportConfig = async () => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.SHARE_DB);
            ipcRenderer.on(channels.SHARE_DB, (event, result) => {
                resolve(result.data);
            });
        });
    },

    importConfig = async (encodedDatabase) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.LOAD_DB, encodedDatabase);
            ipcRenderer.on(channels.LOAD_DB, (event, result) => {
                resolve(result.data);
            });
        });
    },

    addConnection = async (params) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.ADD_CONNECTION, params);
            ipcRenderer.on(channels.ADD_CONNECTION, (event, result) => {
                console.log('result',result);
                resolve(result.data);
            });
        });
    },

    deleteConnection = async (name) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.DELETE_CONNECTION, name);
            ipcRenderer.on(channels.DELETE_CONNECTION, (event, result) => {
                resolve(result.data);
            });
        });
    },

    updateLanguage = async (language) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.UPDATE_LANGUAGE, language);
            ipcRenderer.on(channels.UPDATE_LANGUAGE, (event, result) => {
                resolve(result.data);
            });
        });
    },

    updateTheme = async (theme) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.UPDATE_THEME, theme);
            ipcRenderer.on(channels.UPDATE_THEME, (event, result) => {
                resolve(result.data);
            });
        });
    },

    addTable = async (connectionName, query, type, alias) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.ADD_TABLE, connectionName, query, type, alias);
            ipcRenderer.on(channels.ADD_TABLE, (event, result) => {
                resolve(result.data);
            });
        });
    },

    testTableQuery = async (connectionName, query) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.TEST_QUERY, connectionName, query);
            ipcRenderer.on(channels.TEST_QUERY, (event, result) => {
                resolve(result.data);
            });
        });
    },

    renameTable = async (connectionName, alias, newAlias) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.RENAME_TABLE, connectionName, alias, newAlias);
            ipcRenderer.on(channels.RENAME_TABLE, (event, result) => {
                resolve(result.data);
            });
        });
    },

    deleteTable = async (connectionName, alias) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.DELETE_TABLE, connectionName, alias);
            ipcRenderer.on(channels.DELETE_TABLE, (event, result) => {
                resolve(result.data);
            });
        });
    },

    getTable = async (connectionName, alias) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.GET_TABLE, connectionName, alias);
            ipcRenderer.on(channels.GET_TABLE, (event, result) => {
                resolve(result.data);
            });
        });
    },

    getAllTables = async (connectionName) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.GET_ALL_TABLES, connectionName);
            ipcRenderer.on(channels.GET_ALL_TABLES, (event, result) => {
                resolve(result.data);
            });
        });
    },

    updateTableQuery = async (connectionName, alias, query, newAlias) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.UPDATE_QUERY, connectionName, alias, query, newAlias);
            ipcRenderer.on(channels.UPDATE_QUERY, (event, result) => {
                resolve(result.data);
            });
        });
    },

    loadTableResult = async (connectionName, alias, options) => {
        return new Promise(resolve => {
            ipcRenderer.send(channels.LOAD_QUERY, connectionName, alias, options);
            ipcRenderer.on(channels.LOAD_QUERY, (event, result) => {
                resolve(result.data);
            });
        });
    }

; //END
