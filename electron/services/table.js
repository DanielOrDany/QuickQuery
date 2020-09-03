const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const db = low(adapter);

function getAppDataPath() {
    switch (process.platform) {
        case "darwin": {
            return path.join(process.env.HOME, "Library", "Application Support", "quickAdmin");
        }
        case "win32": {
            return path.join(process.env.APPDATA, "quickAdmin");
        }
        case "linux": {
            return path.join(process.env.HOME, ".quickAdmin");
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

        const sequelize = new Sequelize(URI.database, URI.user, URI.password, URI.others);
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

        const sequelize = new Sequelize(URI.database, URI.user, URI.password, URI.others);
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

async function loadTableResult(connectionName, alias, options) {
    try {
        const URI = db.read()
            .get('connections')
            .find({name: connectionName})
            .get('URI')
            .value();

        const sequelize = new Sequelize(URI.database, URI.user, URI.password, URI.others);
        const offset = Number(options.page) * Number(options.pageSize);
        const limit = Number(options.pageSize);

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

        if (options.search) {
            const search = options.search;
            if (URI.others.dialect === 'mysql')
                query += ` WHERE '%${search.value}%' LIKE CONCAT('%', CAST(id AS CHAR(50)), '%')`;
            else
                query += ` WHERE CAST(${search.column} AS VARCHAR(50)) Like '%${search.value}%'`;
        }

        const countQ = `SELECT COUNT(*) as c FROM (${query}) as c;`;
        const numberOfRecords = await sequelize.query(countQ);

        if (!options.search) query += ` LIMIT ${limit} OFFSET ${offset}`;

        const queryResult = await sequelize.query(query);

        const number = numberOfRecords[0][0].count/limit;
        const one_as_string = String(number).charAt(0);
        const one = Number(one_as_string);
        let pages = 0;

        if (number > one) {
            pages = one + 1;
        } else {
            pages = number;
        }

        if (URI.others.dialect === 'postgres') {
            return {
                "rows": queryResult[1].rows,
                "fields": queryResult[1].fields,
                "pages": pages,
                "records": numberOfRecords[0][0].count
            };
        } else {
            return {
                "rows": queryResult[0],
                "fields": queryResult[0],
                "pages": pages,
                "records": numberOfRecords[0][0].count
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
    renameTable,
    getTable,
    getAllTables,
    updateTableQuery,
    loadTableResult
};
