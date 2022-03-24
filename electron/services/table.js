const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const Sequelize = require('sequelize');
const pg = require('pg');

const { loadFirestoreTable, getFirestoreTableSize, saveFirestoreTableResult } = require('./firestore/table');
const { loadPostgresTable, getPostgresTableSize, savePostgresTableResult } = require('./postgres/table');
const { loadMysqlTable, getMysqlTableSize, saveMysqlTableResult } = require('./mysql/table');
const { isEmpty, sortByLength, getAppDataPath } = require('./helpers');

const auth = require('./auth');
const SequelizeTunnelService = require('./sequalize');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const db = low(adapter);

const MYSQL = "mysql";
const POSTGRESQL = "postgres";
const FIRESTORE = "firestore";

String.prototype.replaceAt=function(index, char) {
    let a = this.split("");
    a[index] = char;
    return a.join("");
}

pg.defaults.ssl = true;

//Add new table to the current connection
async function addTable (connectionName, query, type, alias) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        const URI = connection.URI;
        const sshHost = connection.sshHost;
        const sshPort = connection.sshPort;
        const sshUser = connection.sshUser;
        const sshPrivateKey = connection.sshPrivateKey;
        const connectionQueries = connection.queries;

        let sequelize;

        if (typeof URI === "string") {
            sequelize = new Sequelize(URI);

        } else if (sshHost) {

            // basic connection to a database
            const dbConfig = {
                database: URI.database,
                username: URI.user,
                password: URI.password,
                dialect: URI.others.dialect,
                port: URI.port
            };

            // ssh tunnel configuration
            const tunnelConfig = {
                username: sshUser,
                host: sshHost,
                port: sshPort,
                privateKey: require("fs").readFileSync(sshPrivateKey)
            };

            // initialize service
            const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);
            const connection = await sequelizeTunnelService.getConnection();

            sequelize = connection.sequelize;
        } else if (!sshHost) {
            sequelize = new Sequelize(URI.database,
                URI.user,
                URI.password,
                URI.others
            );
        }

        const index = connectionQueries.findIndex(query => query.alias === alias);
        if (index > 0) throw "Table with this name already exist!";

        // Add new one
        connectionQueries.push({
            "query": query,
            "type": type,
            "alias": alias
        });

        // Update queries
        db.get('connections')
            .find({name: connectionName})
            .get('queries')
            .assign({ connectionQueries })
            .write();

        // let replaced = query.replace(';', ' LIMIT 5 OFFSET 0;');
        // if (query.length === replaced.length) query += ' LIMIT 5 OFFSET 0';
        // if (query.length < replaced.length) query = replaced;

        query = query.replace(';', ' ');
        query += ' LIMIT 3 OFFSET 0';

        const [results, metadata] = await sequelize.query(query);

        return {
            "rows": results,
            "fields": metadata.fields
        }
    } catch (e) {
        console.log(e);
    }
}

async function runQuery (connectionName, query) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        const URI = connection.URI;
        const sshHost = connection.sshHost;
        const sshPort = connection.sshPort;
        const sshUser = connection.sshUser;
        const sshPrivateKey = connection.sshPrivateKey;

        let sequelize;

        if (typeof URI === "string") {
            sequelize = new Sequelize(URI);

        } else if (sshHost) {

            // basic connection to a database
            const dbConfig = {
                database: URI.database,
                username: URI.user,
                password: URI.password,
                dialect: URI.others.dialect,
                port: URI.port
            };

            // ssh tunnel configuration
            const tunnelConfig = {
                username: sshUser,
                host: sshHost,
                port: sshPort,
                privateKey: require("fs").readFileSync(sshPrivateKey)
            };

            // initialize service
            const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);
            const connection = await sequelizeTunnelService.getConnection();

            sequelize = connection.sequelize;
        } else if (!sshHost) {
            sequelize = new Sequelize(URI.database,
                URI.user,
                URI.password,
                URI.others
            );
        }

        query = query.replace(';', ' ');
        query += ' LIMIT 3 OFFSET 0';

        const [results, metadata] = await sequelize.query(query);

        return {
            "rows": results,
            "fields": metadata.fields
        }
    } catch (e) {
        console.log(e);
    }
}

async function searchByAllTables(connectionName, value) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        const URI = connection.URI;
        const sshHost = connection.sshHost;
        const sshPort = connection.sshPort;
        const sshUser = connection.sshUser;
        const sshPrivateKey = connection.sshPrivateKey;

        let sequelize;

        if (typeof URI === "string") {
            sequelize = new Sequelize(URI);

        } else if (sshHost) {

            // basic connection to a database
            const dbConfig = {
                database: URI.database,
                username: URI.user,
                password: URI.password,
                dialect: URI.others.dialect,
                port: URI.port
            };

            // ssh tunnel configuration
            const tunnelConfig = {
                username: sshUser,
                host: sshHost,
                port: sshPort,
                privateKey: require("fs").readFileSync(sshPrivateKey)
            };

            // initialize service
            const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);
            const connection = await sequelizeTunnelService.getConnection();

            sequelize = connection.sequelize;
        } else if (!sshHost) {
            sequelize = new Sequelize(URI.database,
                URI.user,
                URI.password,
                URI.others
            );
        }

        const defaultTables = connection.queries.filter((q) => q.type === 'default_query');

        const result = await Promise.all(defaultTables.map(async (t) => {
            const columnsQuery = `select column_name from information_schema.columns where table_name='${t.table}'`;

            const tableColumns = await sequelize.query(columnsQuery);

            const columns = tableColumns[0].map(column => {
                if (column.column_name) {
                    return column.column_name;
                } else {
                    return column.COLUMN_NAME;
                }
            });

            console.log(result); // [column_name, ..]

            const query = `SELECT * FROM ${t.table} WHERE ${value} in (${columns.join()});`;
            const qResult = await sequelize.query(query);
            return qResult;
        }));
    } catch (e) {
        console.log(e);
    }
}

async function updateDefaultTableRow(id, token, connectionName, alias, columnsAndValues) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        const table = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value();

        const URI = connection.URI;
        const sshHost = connection.sshHost;
        const sshPort = connection.sshPort;
        const sshUser = connection.sshUser;
        const sshPrivateKey = connection.sshPrivateKey;

        let sequelize;

        if (typeof URI === "string") {
            sequelize = new Sequelize(URI);

        } else if (sshHost) {

            // basic connection to a database
            const dbConfig = {
                database: URI.database,
                username: URI.user,
                password: URI.password,
                dialect: URI.others.dialect,
                port: URI.port
            };

            // ssh tunnel configuration
            const tunnelConfig = {
                username: sshUser,
                host: sshHost,
                port: sshPort,
                privateKey: require("fs").readFileSync(sshPrivateKey)
            };

            // initialize service
            const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);
            const connection = await sequelizeTunnelService.getConnection();

            sequelize = connection.sequelize;
        } else if (!sshHost) {
            sequelize = new Sequelize(URI.database,
                URI.user,
                URI.password,
                URI.others
            );
        }

        const updateColumns = columnsAndValues.filter((rc) => rc.length > 2);
        const oldColumns = columnsAndValues.filter((rc) => rc.length < 3);

        const newColumnValues = updateColumns.map((uc) => {
            return ` ${uc[1]}`;
        });
        const oldColumnValues = updateColumns.map((uc) => {
            return ` ${uc[2]}`;
        });

        let newValues = updateColumns.map((cAndV) => {
            return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`}`;
        });

        const oldColumnsLen = oldColumns.length;
        let oldValues = oldColumns.map((cAndV, index) => {
            if (index === oldColumnsLen - 1) {
                return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`}`;
            } else {
                return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`} AND`;
            }
        });

        const query = `UPDATE ${table.table} SET ${newValues.join()} WHERE ${oldValues.join().replace(/,/g, '')};`;

        auth.addHistoryItem(id, token, 'update', table.table, oldColumnValues.join(), newColumnValues.join());
        return await sequelize.query(query);
    } catch (e) {
        console.log(e);
    }
}

async function deleteDefaultTableRow(id, token, connectionName, alias, columnsAndValues) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        const table = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value();

        const URI = connection.URI;
        const sshHost = connection.sshHost;
        const sshPort = connection.sshPort;
        const sshUser = connection.sshUser;
        const sshPrivateKey = connection.sshPrivateKey;

        let sequelize;

        if (typeof URI === "string") {
            sequelize = new Sequelize(URI);

        } else if (sshHost) {

            // basic connection to a database
            const dbConfig = {
                database: URI.database,
                username: URI.user,
                password: URI.password,
                dialect: URI.others.dialect,
                port: URI.port
            };

            // ssh tunnel configuration
            const tunnelConfig = {
                username: sshUser,
                host: sshHost,
                port: sshPort,
                privateKey: require("fs").readFileSync(sshPrivateKey)
            };

            // initialize service
            const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);
            const connection = await sequelizeTunnelService.getConnection();

            sequelize = connection.sequelize;
        } else if (!sshHost) {
            sequelize = new Sequelize(URI.database,
                URI.user,
                URI.password,
                URI.others
            );
        }

        const oldColumnsLen = columnsAndValues.length;
        let where = columnsAndValues.map((cAndV, index) => {
            if (index === oldColumnsLen - 1) {
                return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`}`;
            } else {
                return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`} and`;
            }
        });

        const query = `DELETE FROM ${table.table} WHERE ${where.join().replace(/,/g, '')};`;

        auth.addHistoryItem(id, token, 'delete', table.table, where.join().replace(/,/g, ''));
        return await sequelize.query(query);
    } catch (e) {
        console.log(e);
    }
}

function renameTable (connectionName, alias, newAlias) {
    console.log(connectionName, alias, newAlias);
    // Get queries
    const queries = db.read()
        .get('connections')
        .find({name: connectionName})
        .get('queries')
        .value();

    // Add new one
    const index = queries.findIndex(query => query.alias === alias);
    queries[index].alias = newAlias;

    // Update queries
    db.get('connections')
        .find({name: connectionName})
        .get('queries')
        .assign({ queries })
        .write();

    console.log(queries);
    return queries;
}

function deleteTable (connectionName, alias) {
    // Get queries
    const queries = db.read()
        .get('connections')
        .find({name: connectionName})
        .get('queries')
        .value();

    // Add new one
    queries.splice(
        queries.findIndex(query => query.alias === alias), 1);

    // Update queries
    db.get('connections')
        .find({name: connectionName})
        .get('queries')
        .assign({ queries })
        .write();

    return queries;
}

function getTable (connectionName, alias) {
    // Get table
    return db.read()
        .get('connections')
        .find({name: connectionName})
        .get('queries')
        .find({alias: alias})
        .value();
}

function getAllTables(connectionName) {
    // Get tables
    return db.read()
        .get('connections')
        .find({name: connectionName})
        .get('queries')
        .value();
}

function verifyQuery(query) {
    const exceptions = [' delete ', ' update '];

    exceptions.forEach(exception => {
        if (query.includes(exception)) {
            throw "Query is not valid"
        }
    })
}

async function updateTableQuery(connectionName, alias, newQuery, newAlias) {
    try {
        // verify that query have select character
        verifyQuery(newQuery);

        // Get queries
        const queries = await db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .value();

        // Add new one
        const index = queries.findIndex(query => query.alias === alias);
        queries[index].query = newQuery;
        queries[index].alias = newAlias;

        // Update queries
        await db.get('connections')
            .find({name: connectionName})
            .get('queries')
            .assign({ queries })
            .write();

        return queries;

    } catch (e) {

        console.error(e);
    }
}

async function loadTableResult(connectionName, alias, loadingOptions) {
    try {
        const connection = db.read()
            .get('connections')
            .find({ name: connectionName })
            .value();

        const queryData = db.read()
            .get('connections')
            .find({ name: connectionName })
            .get('queries')
            .find({ alias: alias })
            .value();

        let result;

        if (connection.dtype === FIRESTORE) {
            result = await loadFirestoreTable(connection, queryData, loadingOptions);
        } else if (connection.dtype === POSTGRESQL) {
            result = await loadPostgresTable(connection, queryData, loadingOptions);
        } else if (connection.dtype === MYSQL) {
            result = await loadMysqlTable(connection, queryData, loadingOptions);
        }

        return result;
    } catch (e) {
        console.log(`[${new Date().toLocaleString()}] LOAD TABLE ROWS & HEADERS ERROR: `, e);
    }
}

async function getTableSize(connectionName, alias) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        // Get table name
        const table = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value().table;

        let result;
        if (connection.dtype === FIRESTORE) {
            result = await getFirestoreTableSize(connection, table);
        } else if(connection.dtype === MYSQL) {
            result = await getMysqlTableSize(connection, connectionName, alias);
        } else if(connection.dtype === POSTGRESQL) {
            result = await getPostgresTableSize(connection, connectionName, alias);
        }

        return result;

    } catch (e) {
        console.log(`[${new Date().toLocaleString()}] GET TABLE SIZE ERROR: `, e);
    }
}

async function getTableColumns(connectionName, table) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        const URI = connection.URI;
        const sshHost = connection.sshHost;
        const sshPort = connection.sshPort;
        const sshUser = connection.sshUser;
        const sshPrivateKey = connection.sshPrivateKey;

        let sequelize;

        if (typeof URI === "string") {
            sequelize = new Sequelize(URI);

        } else if (sshHost) {

            // basic connection to a database
            const dbConfig = {
                database: URI.database,
                username: URI.user,
                password: URI.password,
                dialect: URI.others.dialect,
                port: URI.port
            };

            // ssh tunnel configuration
            const tunnelConfig = {
                username: sshUser,
                host: sshHost,
                port: sshPort,
                privateKey: require("fs").readFileSync(sshPrivateKey)
            };

            // initialize service
            const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);
            const connection = await sequelizeTunnelService.getConnection();

            sequelize = connection.sequelize;
        } else if (!sshHost) {
            sequelize = new Sequelize(URI.database,
                URI.user,
                URI.password,
                URI.others
            );
        }

        let query = `select column_name from information_schema.columns where table_name='${table}'`;

        const tableColumns = await sequelize.query(query);

        const result = tableColumns[0].map(column => {
            if (column.column_name) {
                return column;
            } else {
                return {
                    column_name: column.COLUMN_NAME
                }
            }
        });
        console.log(result);

        return result;
    } catch (e) {
        console.log(e);
    }
}

async function saveTableResult(connectionName, alias, loadingOptions) {
    try {
        const connection = db.read()
            .get('connections')
            .find({name: connectionName})
            .value();

        let queryData = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value();

        let result;
        if (connection.dtype === FIRESTORE) {
            result = await saveFirestoreTableResult(connection, queryData, loadingOptions);
        } else if(connection.dtype === MYSQL) {
            result = await saveMysqlTableResult(connection, connectionName, alias);
        } else if(connection.dtype === POSTGRESQL) {
            result = await savePostgresTableResult(connection, connectionName, alias);
        }

        return result;
    } catch (e) {
        console.log(e);
    }
}

// Export db's methods
module.exports = {
    runQuery,
    deleteTable,
    addTable,
    saveTableResult,
    renameTable,
    getTable,
    getAllTables,
    updateTableQuery,
    loadTableResult,
    getTableColumns,
    getTableSize,
    updateDefaultTableRow,
    deleteDefaultTableRow,
    searchByAllTables
};
