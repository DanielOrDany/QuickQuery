const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const db = low(adapter);

const MYSQL = "mysql";
const POSTGRESQL = "postgres";

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
        const connectionQueries = connection.queries;

        const sequelize = URI.database ? new Sequelize(
            URI.database,
            URI.user,
            URI.password,
            URI.others
        ) : new Sequelize(URI);

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
        query += ' LIMIT 10 OFFSET 0';

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
        const URI = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('URI')
            .value();

        const sequelize = URI.database ? new Sequelize(
            URI.database,
            URI.user,
            URI.password,
            URI.others
        ) : new Sequelize(URI);

        query = query.replace(';', ' ');
        query += ' LIMIT 10 OFFSET 0';

        const [results, metadata] = await sequelize.query(query);

        return {
            "rows": results,
            "fields": metadata.fields
        }
    } catch (e) {
        console.log(e);
    }
}

function renameTable (connectionName, alias, newAlias) {
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
    db.read()
        .get('connections')
        .find({name: connectionName})
        .get('queries')
        .assign({ queries })
        .write();
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

    console.log(queries);

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
    const exceptions = ['delete', 'update'];

    exceptions.forEach(exception => {
        if (query.includes(exception)) {
            throw "Query is not valid"
        }
    })
}

function updateTableQuery(connectionName, alias, query) {
    // verify that query have select character
    verifyQuery(query);

    // Get queries
    const queries = db.read()
        .get('connections')
        .find({name: connectionName})
        .get('queries')
        .value();

    // Add new one
    const index = queries.findIndex(query => query.alias === alias);
    queries[index].query = query;

    // Update queries
    db.get('connections')
        .find({name: connectionName})
        .get('queries')
        .assign({ queries })
        .write();

    return queries;
}

async function loadTableResult(connectionName, alias, loadingOptions) {
    try {
        const URI = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('URI')
            .value();

        console.log(URI);

        const sequelize = URI.database ? new Sequelize(
            URI.database,
            URI.user,
            URI.password,
            URI.others
        ) : new Sequelize(URI);

        const offset = Number(loadingOptions.page) * Number(loadingOptions.pageSize);
        const limit = Number(loadingOptions.pageSize);

        let dialect;
        if (typeof URI === 'string') {
            dialect = URI.split('://')[0];
        } else {
            dialect = URI.others.dialect;
        }

        console.log('dialect: ', dialect);

        // Get table result
        let query = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('queries')
            .find({alias: alias})
            .value().query;

        if (query[query.length] === ';') {
            query = query[query.length].replace(';', ' ');
        }

        console.log("operationsOptions: ", loadingOptions.operationsOptions);

        if (loadingOptions.operationsOptions) {
            // Add searches
            let searchColumnNum = 0;

            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;
                const search = option.search;

                // Join cases
                if (column.match('_')) {
                    column = column.replace('_', '.');
                }

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
                const column = option.column;
                const filter1 = option.filter1;
                const filter2 = option.filter2;

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
                        console.log(n1,n2, n2 < n1);

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
                query += ` ORDER BY ${lastChangedOption.column} ${lastChangedOption.order}`;
                orderByNum += 1;
            }

            loadingOptions.operationsOptions.forEach((option) => {
                const column = option.column;
                const order = option.order;

                if (orderByNum > 0 && !option.last) {
                    query += `, ${column} ${order}`;
                } else if (orderByNum === 0 && !option.last) {
                    query += ` ORDER BY ${column} ${order}`;
                    orderByNum += 1;
                }
            });
        }

        const countQ = `SELECT COUNT(*) as c FROM (${query}) as c;`;
        const numberOfRecords = await sequelize.query(countQ);

        // if (!loadingOptions.search)
        query += ` LIMIT ${limit} OFFSET ${offset}`;

        const queryResult = await sequelize.query(query);

        const number = numberOfRecords[0][0].c/limit;
        const one_as_string = String(number).charAt(0);
        const one = Number(one_as_string);
        let pages = 0;
        const records = numberOfRecords[0][0].c;

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
                "pages": pages,
                "records": records
            };
        } else {
            return {
                "rows": queryResult[0],
                "fields": queryResult[0],
                "pages": pages,
                "records": records
            };
        }
    } catch (e) {
        console.log(e);
    }
}

function isEmpty(str) {
    return !str.trim().length;
}

async function getTableColumns(connectionName, table) {
    console.log(connectionName, table);
    try {
        const URI = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('URI')
            .value();

        const sequelize = URI.database ? new Sequelize(
            URI.database,
            URI.user,
            URI.password,
            URI.others
        ) : new Sequelize(URI);

        const query = `select column_name from information_schema.columns where table_name='${table}';`;

        const result = await sequelize.query(query);
        return result[0];
    } catch (e) {
        console.log(e);
    }
}

async function joinTables(connectionName, tableOne, tableTwo, whereStatement) {
    const queryLimit = query += ' LIMIT 1 OFFSET 0';
    const [results, metadata] = await sequelize.query(queryLimit);

    return {
        "query": query,
        "rows": results,
        "fields": metadata.fields
    };
}

// Export db's methods
module.exports = {
    runQuery,
    deleteTable,
    addTable,
    renameTable,
    getTable,
    getAllTables,
    updateTableQuery,
    loadTableResult,
    joinTables,
    getTableColumns
};
