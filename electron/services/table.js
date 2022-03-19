const low = require('lowdb');
const path = require('path');
const auth = require('./auth');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const db = low(adapter);
const FireSQL = require("firesql").FireSQL;
const SequelizeTunnelService = require('./sequalize');
const admin = require("firebase-admin");
const MYSQL = "mysql";
const POSTGRESQL = "postgres";
const FIRESTORE = "firestore";

function sortByLength (array) {
    return array.sort((x,y) => x.length - y.length);
}

String.prototype.replaceAt=function(index, char) {
    let a = this.split("");
    a[index] = char;
    return a.join("");
}

function getAppDataPath() {
    switch (process.platform) {
        case "darwin": {
            return path.join(process.env.HOME, "Library", "Application Support", "QuickQuery");
        }
        case "win32": {
            return path.join(process.env.APPDATA, "QuickQuery");
        }
        case "linux": {
            return path.join(process.env.HOME, ".QuickQuery");
        }
        default: {
            console.log("Unsupported platform!");
            process.exit(1);
        }
    }
}

const Sequelize = require('sequelize');
const pg = require('pg');
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
            .find({name: connectionName})
            .value();

        if (connection.dtype === FIRESTORE) {
            const serviceAccount = require(connection.firebaseConfig);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });

            const firebase_db = admin.firestore();

            const fireSQL = new FireSQL(firebase_db);

            const citiesPromise = await fireSQL.query(`SELECT * FROM public`);

            console.log(citiesPromise);

        } else {
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

            const offset = Number(loadingOptions.page) * Number(loadingOptions.pageSize);
            const limit = Number(loadingOptions.pageSize);
            const numberOfRecords = Number(loadingOptions.numberOfRecords);
            const tableColumns = loadingOptions.columns ? sortByLength(loadingOptions.columns) : [];

            let dialect;

            if (typeof URI === 'string') {
                dialect = URI.split('://')[0];
            } else {
                dialect = URI.others.dialect;
            }

            // Get table result
            const queryData = db.read()
                .get('connections')
                .find({name: connectionName})
                .get('queries')
                .find({alias: alias})
                .value();

            let query = queryData.query;
            let queryType = queryData.type;

            if (query[query.length] === ';') {
                query = query[query.length].replace(';', ' ');
            }

            if (loadingOptions.operationsOptions) {
                // Add searches
                let searchColumnNum = 0;

                loadingOptions.operationsOptions.forEach((option) => {
                    let column = option.column;
                    const search = option.search;

                    // Join cases
                    tableColumns.forEach(tableColumn => {
                        const regex = /\./g;
                        const fullColumn = column.replace(regex, '_');

                        if (fullColumn.match(tableColumn)) {
                            column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                        }
                    });

                    if (dialect === MYSQL && searchColumnNum === 0 && search != "") {
                        query += ` WHERE CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
                        searchColumnNum += 1;
                    } else if (dialect === POSTGRESQL && searchColumnNum === 0 && search != "") {
                        query += ` WHERE CAST(${column} AS VARCHAR(50)) Like '%${search}%'`;
                        searchColumnNum += 1;
                    } else if (dialect === MYSQL && searchColumnNum > 0 && search != "") {
                        query += ` AND CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
                        searchColumnNum += 1;
                    } else if (dialect === POSTGRESQL && searchColumnNum > 0 && search != "") {
                        query += ` AND CAST(${column} AS VARCHAR(50)) Like '%${search}%'`;
                        searchColumnNum += 1;
                    }
                });

                // Add filters
                loadingOptions.operationsOptions.forEach((option) => {
                    let column = option.column;

                    const filter1 = option.filter1;
                    const filter2 = option.filter2;

                    // Join cases
                    tableColumns.forEach(tableColumn => {
                        const regex = /\./g;
                        const fullColumn = column.replace(regex, '_');

                        if (fullColumn.match(tableColumn)) {
                            column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                        }
                    });

                    if (!isEmpty(filter1) && !isEmpty(filter2)) {
                        const filter1IsDate = (new Date(filter1) !== "Invalid Date") && !isNaN(new Date(filter1));
                        const filter1IsNumber = /^-?\d+$/.test(filter1);
                        const filter2IsDate = (new Date(filter2) !== "Invalid Date") && !isNaN(new Date(filter2));
                        const filter2IsNumber = /^-?\d+$/.test(filter2);

                        // Date
                        if (
                            filter1IsDate &&
                            filter2IsDate &&
                            !filter1IsNumber &&
                            !filter2IsNumber
                        ) {
                            const newFilter1 = filter1.split("/");
                            const newFilter2 = filter2.split("/");
                            const d1 = newFilter1[2] + newFilter1[0] + newFilter1[1];
                            const d2 = newFilter2[2] + newFilter2[0] + newFilter2[1];

                            if (searchColumnNum > 0) {
                                if (d2 < d1) {
                                    query += ` AND ${column} BETWEEN \'${d2}\' AND \'${d1}\'`;
                                    searchColumnNum += 1;
                                } else {
                                    query += ` AND ${column} BETWEEN \'${d1}\' AND \'${d2}\'`;
                                    searchColumnNum += 1;
                                }
                            } else {
                                if (d2 < d1) {
                                    query += ` WHERE ${column} BETWEEN \'${d2}\' AND \'${d1}\'`;
                                    searchColumnNum += 1;
                                } else {
                                    query += ` WHERE ${column} BETWEEN \'${d1}\' AND \'${d2}\'`;
                                    searchColumnNum += 1;
                                }
                            }

                            // numbers
                        } else {
                            const n1 = parseInt(filter1);
                            const n2 = parseInt(filter2);

                            if (searchColumnNum > 0) {
                                if (n2 < n1) {
                                    query += ` AND ${column} BETWEEN ${filter2} AND ${filter1}`;
                                    searchColumnNum += 1;
                                } else {
                                    query += ` AND ${column} BETWEEN ${filter1} AND ${filter2}`;
                                    searchColumnNum += 1;
                                }
                            } else {
                                if (n2 < n1) {
                                    query += ` WHERE ${column} BETWEEN ${filter2} AND ${filter1}`;
                                    searchColumnNum += 1;
                                } else {
                                    query += ` WHERE ${column} BETWEEN ${filter1} AND ${filter2}`;
                                    searchColumnNum += 1;
                                }
                            }
                        }
                    }
                });

                // Add orders
                let orderByNum = 0;

                const lastChangedOption = loadingOptions.operationsOptions.find((option) => option.last === true);

                if (lastChangedOption) {
                    let lastTableColumn = lastChangedOption.column;

                    tableColumns.forEach(tableColumn => {
                        if (lastChangedOption.column.match(tableColumn)) {
                            lastTableColumn = lastChangedOption.column.replace(`${tableColumn}_`, `${tableColumn}.`);
                        }
                    });

                    query += ` ORDER BY ${lastTableColumn} ${lastChangedOption.order}`;
                    orderByNum += 1;
                }

                loadingOptions.operationsOptions.forEach((option) => {
                    let column = option.column;

                    const order = option.order;

                    // Join cases
                    tableColumns.forEach(tableColumn => {
                        console.log(tableColumn);
                        const regex = /\./g;
                        const fullColumn = column.replace(regex, '_');

                        if (fullColumn.match(tableColumn) && queryType === 'new') {
                            column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                        }
                    });

                    if (orderByNum > 0 && !option.last) {
                        query += `, ${column} ${order}`;
                    } else if (orderByNum === 0 && !option.last) {
                        query += ` ORDER BY ${column} ${order}`;
                        orderByNum += 1;
                    }
                });
            }

            query += ` LIMIT ${limit} OFFSET ${offset}`;

            const queryResult = await sequelize.query(query);

            const number = numberOfRecords/limit;
            const one = Number(number).toFixed(0);

            let pages = 0;
            const records = numberOfRecords;

            if (number > one) {
                pages = one + 1;
            } else {
                pages = number;
            }

            console.log('pages: ', pages);
            console.log('records: ', records);

            if (dialect === POSTGRESQL) {
                return {
                    "rows": queryResult[1].rows,
                    "fields": queryResult[1].fields,
                    "pages": Math.ceil(pages),
                    "records": records
                };
            } else {
                return {
                    "rows": queryResult[0],
                    "fields": queryResult[0],
                    "pages": Math.ceil(pages),
                    "records": records
                };
            }
        }
    } catch (e) {
        console.log(e);
    }
}

function isEmpty(str) {
    return !str.trim().length;
}

async function getTableSize(connectionName, alias) {
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

        // Get table result
        const query = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value().query;

        const countQ = `SELECT COUNT(*) as c FROM (${query}) as c;`;
        const numberOfRecords = await sequelize.query(countQ);

        return numberOfRecords[0][0].c;
    } catch (e) {
        console.log(e);
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

        const offset = Number(loadingOptions.page) * Number(loadingOptions.pageSize);
        const limit = Number(loadingOptions.pageSize);
        const numberOfRecords = Number(loadingOptions.numberOfRecords);
        const tableColumns = loadingOptions.columns ? sortByLength(loadingOptions.columns) : [];
        let dialect;

        if (typeof URI === 'string') {
            dialect = URI.split('://')[0];
        } else {
            dialect = URI.others.dialect;
        }

        // Get table result
        let queryData = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value();

        let query = queryData.query;

        let queryType = queryData.type;

        if (query[query.length] === ';') {
            query = query[query.length].replace(';', ' ');
        }

        if (loadingOptions.operationsOptions) {
            // Add searches
            let searchColumnNum = 0;

            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;
                const search = option.search;

                // Join cases
                tableColumns.forEach(tableColumn => {
                    const regex = /\./g;
                    const fullColumn = column.replace(regex, '_');

                    if (fullColumn.match(tableColumn)) {
                        column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                    }
                });

                if (dialect === MYSQL && searchColumnNum === 0 && search != "") {
                    query += ` WHERE CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
                    searchColumnNum += 1;
                } else if (dialect === POSTGRESQL && searchColumnNum === 0 && search != "") {
                    query += ` WHERE CAST(${column} AS VARCHAR(50)) Like '%${search}%'`;
                    searchColumnNum += 1;
                } else if (dialect === MYSQL && searchColumnNum > 0 && search != "") {
                    query += ` AND CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
                    searchColumnNum += 1;
                } else if (dialect === POSTGRESQL && searchColumnNum > 0 && search != "") {
                    query += ` AND CAST(${column} AS VARCHAR(50)) Like '%${search}%'`;
                    searchColumnNum += 1;
                }
            });

            // Add filters
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;

                const filter1 = option.filter1;
                const filter2 = option.filter2;

                // Join cases
                // TODO: bug companies.services & companies

                // employees.schedule_date vs employees_restored_at | employees_schedule vs employees

                tableColumns.forEach(tableColumn => {
                    const regex = /\./g;
                    const fullColumn = column.replace(regex, '_');

                    if (fullColumn.match(tableColumn)) {
                        column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                    }
                });

                if (!isEmpty(filter1) && !isEmpty(filter2)) {
                    const filter1IsDate = (new Date(filter1) !== "Invalid Date") && !isNaN(new Date(filter1));
                    const filter1IsNumber = /^-?\d+$/.test(filter1);
                    const filter2IsDate = (new Date(filter2) !== "Invalid Date") && !isNaN(new Date(filter2));
                    const filter2IsNumber = /^-?\d+$/.test(filter2);

                    // Date
                    if (
                        filter1IsDate &&
                        filter2IsDate &&
                        !filter1IsNumber &&
                        !filter2IsNumber
                    ) {
                        const newFilter1 = filter1.split("/");
                        const newFilter2 = filter2.split("/");
                        const d1 = newFilter1[2] + newFilter1[0] + newFilter1[1];
                        const d2 = newFilter2[2] + newFilter2[0] + newFilter2[1];

                        if (searchColumnNum > 0) {
                            if (d2 < d1) {
                                query += ` AND ${column} BETWEEN \'${d2}\' AND \'${d1}\'`;
                            } else {
                                query += ` AND ${column} BETWEEN \'${d1}\' AND \'${d2}\'`;
                            }
                        } else {
                            if (d2 < d1) {
                                query += ` WHERE ${column} BETWEEN \'${d2}\' AND \'${d1}\'`;
                            } else {
                                query += ` WHERE ${column} BETWEEN \'${d1}\' AND \'${d2}\'`;
                            }
                        }

                        // numbers
                    } else {
                        const n1 = parseInt(filter1);
                        const n2 = parseInt(filter2);

                        if (searchColumnNum > 0) {
                            if (n2 < n1) {
                                query += ` AND ${column} BETWEEN ${filter2} AND ${filter1}`;
                            } else {
                                query += ` AND ${column} BETWEEN ${filter1} AND ${filter2}`;
                            }
                        } else {
                            if (n2 < n1) {
                                query += ` WHERE ${column} BETWEEN ${filter2} AND ${filter1}`;
                            } else {
                                query += ` WHERE ${column} BETWEEN ${filter1} AND ${filter2}`;
                            }
                        }
                    }
                }
            });

            // Add orders
            let orderByNum = 0;

            const lastChangedOption = loadingOptions.operationsOptions.find((option) => option.last === true);

            if (lastChangedOption) {
                let lastTableColumn = lastChangedOption.column;

                tableColumns.forEach(tableColumn => {
                    if (lastChangedOption.column.match(tableColumn)) {
                        lastTableColumn = lastChangedOption.column.replace(`${tableColumn}_`, `${tableColumn}.`);
                    }
                });

                query += ` ORDER BY ${lastTableColumn} ${lastChangedOption.order}`;
                orderByNum += 1;
            }

            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;

                const order = option.order;

                // Join cases
                tableColumns.forEach(tableColumn => {
                    const regex = /\./g;
                    const fullColumn = column.replace(regex, '_');

                    if (fullColumn.match(tableColumn) && queryType === 'new') {
                        column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                    }
                });

                if (orderByNum > 0 && !option.last) {
                    query += `, ${column} ${order}`;
                } else if (orderByNum === 0 && !option.last) {
                    query += ` ORDER BY ${column} ${order}`;
                    orderByNum += 1;
                }
            });
        }

        /** Full table */
        const number = numberOfRecords/limit;
        const one = Number(number).toFixed(0);

        let pages = 0;
        const records = numberOfRecords;

        if (number > one) {
            pages = one + 1;
        } else {
            pages = number;
        }

        let queryResult;

        const downloadLimit = 1000;
        const cycles = Math.ceil(numberOfRecords / downloadLimit);
        
        for(let i = 0; i < cycles; i++) {
            let queryShard = query + ` LIMIT ${downloadLimit} OFFSET ${i * downloadLimit}`;
            let queryShardResult = await sequelize.query(queryShard);
            if(i === 0) {
                queryResult = queryShardResult;
            } else {
                queryResult[0] = [...queryResult[0], ...queryShardResult[0]];
                queryResult[1].rows = [...queryResult[1].rows, ...queryShardResult[1].rows];
            }
        }

        if (dialect === POSTGRESQL) {
            return {
                "rows": queryResult[1].rows,
                "fields": queryResult[1].fields
            };
        } else {
            return {
                "rows": queryResult[0],
                "fields": queryResult[0]
            };
        }
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
