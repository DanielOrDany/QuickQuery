const SequelizeTunnelService = require('../sequalize');
const Sequelize = require('sequelize');
const path = require('path');
const low = require('lowdb');
const pg = require('pg');

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

module.exports = {
    loadMysqlTable,
    getMysqlTableSize
};