const SequelizeTunnelService = require('../sequalize');
const Sequelize = require('sequelize');
const path = require('path');
const low = require('lowdb');
const pg = require('pg');
const auth = require('../auth');

const { isEmpty, sortByLength, getAppDataPath } = require('../helpers');

const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const db = low(adapter);


pg.defaults.ssl = true;

async function getMysqlTableSize(connection, connectionName, alias) {
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
        .value()
        .query;

    const countQ = `SELECT COUNT(*) as c FROM (${query}) as c;`;
    const numberOfRecords = await sequelize.query(countQ);

    return numberOfRecords[0][0].c;
}

async function loadMysqlTable(connection, queryData, loadingOptions) {
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

            if (searchColumnNum === 0 && search != "") {
                query += ` WHERE CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
                searchColumnNum += 1;
            } else if (searchColumnNum > 0 && search != "") {
                query += ` AND CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
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

        let order;
        let orderColumn;

        loadingOptions.operationsOptions.forEach((option) => {
            if (option.order) {
                order = option.order;
                orderColumn = option.column;
            }
        });

        if (orderColumn && order) {
            query += ` ORDER BY ${orderColumn} ${order}`;
        }

        // Add orders
        // let orderByNum = 0;
        //
        // const lastChangedOption = loadingOptions.operationsOptions.find((option) => option.last === true);
        //
        // if (lastChangedOption) {
        //     let lastTableColumn = lastChangedOption.column;
        //
        //     tableColumns.forEach(tableColumn => {
        //         if (lastChangedOption.column.match(tableColumn)) {
        //             lastTableColumn = lastChangedOption.column.replace(`${tableColumn}_`, `${tableColumn}.`);
        //         }
        //     });
        //
        //     query += ` ORDER BY ${lastTableColumn} ${lastChangedOption.order}`;
        //     orderByNum += 1;
        // }


        // loadingOptions.operationsOptions.forEach((option) => {
        //     let column = option.column;
        //
        //     const order = option.order;
        //
        //     // Join cases
        //     tableColumns.forEach(tableColumn => {
        //         const regex = /\./g;
        //         const fullColumn = column.replace(regex, '_');
        //
        //         if (fullColumn.match(tableColumn) && queryType === 'new') {
        //             column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
        //         }
        //     });
        //
        //     if (orderByNum === 0 && order === 'DESC') {
        //         query += ` ORDER BY ${column} ${order}`;
        //         orderByNum += 1;
        //     }
        //
        //     // if (orderByNum > 0 && !option.last) {
        //     //     query += `, ${column} ${order}`;
        //     // } else if (orderByNum === 0 && !option.last) {
        //     //     query += ` ORDER BY ${column} ${order}`;
        //     //     orderByNum += 1;
        //     // }
        // });
    }

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const number = numberOfRecords/limit;
    const one = Number(number).toFixed(0);

    let pages = 0;
    const records = numberOfRecords;

    if (number > one) {
        pages = one + 1;
    } else {
        pages = number;
    }

    const queryResult = await sequelize.query(query);

    return {
        "rows": queryResult[0],
        "fields": queryResult[0],
        "pages": Math.ceil(pages),
        "records": records
    }
}


async function saveMysqlTableResult(connection, queryData, loadingOptions) {
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

            if (searchColumnNum === 0 && search != "") {
                query += ` WHERE CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
                searchColumnNum += 1;
            } else if (searchColumnNum > 0 && search != "") {
                query += ` AND CONCAT('%', CAST(${column} AS CHAR(50)), '%') LIKE '%${search}%'`;
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

    for (let i = 0; i < cycles; i++) {
        let queryShard = query + ` LIMIT ${downloadLimit} OFFSET ${i * downloadLimit}`;
        let queryShardResult = await sequelize.query(queryShard);
        if (i === 0) {
            queryResult = queryShardResult;
        } else {
            queryResult[0] = [...queryResult[0], ...queryShardResult[0]];
            queryResult[1].rows = [...queryResult[1].rows, ...queryShardResult[1].rows];
        }
    }

    return {
        "rows": queryResult[0],
        "fields": queryResult[0]
    }
}

async function updateDefaultMysqlTableRow(id, token, connection, table, columnsAndValues) {
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
}

async function deleteDefaultMysqlTableRow(id, token, connection, table, columnsAndValues) {
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
}

async function getMysqlTableColumns(connection, table) {
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

    return result;
}

async function runMysqlQuery(connection, query) {
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
}

module.exports = {
    loadMysqlTable,
    getMysqlTableSize,
    saveMysqlTableResult,
    updateDefaultMysqlTableRow,
    deleteDefaultMysqlTableRow,
    getMysqlTableColumns,
    runMysqlQuery
};