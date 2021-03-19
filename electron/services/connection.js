const low = require('lowdb');
const path = require('path');
const fs = require('fs');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));

if(fs.existsSync(adapter.source)) {
    console.log("The file exists.");
} else {
    console.log('The file does not exist.');
    if(!fs.existsSync(appDataDirPath)) {
        fs.mkdirSync(appDataDirPath);
    }
    fs.writeFileSync(adapter.source, JSON.stringify({
        "connections": [],
        "settings":
            {
                "language": "en",
                "theme": "white"
            },
        "licenseKey": "ZChKQCQxeiMkIWRnZGYkJTJmZA=="
    }));

    if(fs.existsSync(adapter.source)) {
        console.log("The file exists.");
    } else {
        console.log('The file does not exist. 2');
    }
}

const db = low(adapter);

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


async function verifyConnection (name) {
    const connectionInDatabase = await db.get('connections').find({name: name}).value();
    if (connectionInDatabase)
        throw "Connection with this name already exist!";
}


async function addConnection(params) {
    let { name, host, port, user, password, database, schema, dtype, uri } = params;

    if (uri) {
        dtype = uri.split('://')[0];
    }

    // throw error if connection already exist
    await verifyConnection(name);

    try {
        const sequelize = uri ? new Sequelize(uri) : new Sequelize(
            database,
            user,
            password,
            {
                host: host,
                dialect: dtype,
                ssl: true,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: true // <<<<<< YOU NEED THIS
                    }
                }}
        );

        const selectAllTablesQuery = `
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_type='BASE TABLE'
        AND table_schema='${schema}';`;

        const connection = {
            name: name, // connection alias
            URI: uri ? uri : { // connection credentials
                database: database,
                user: user,
                password: password,
                schema: schema,
                port: port,
                others: {
                    host: host,
                    dialect: dtype
                }
            },
            queries: [], // saved constructor queries
            native_tables: [] // native db names of tables
        };

        /** Select All Tables */
        /* Select all names of tables in database and creating default queries */

        await sequelize.query(selectAllTablesQuery).then(tables => {

            // Generate default queries
            if (dtype === 'postgres') {
                tables[0].forEach(table => {

                    // save native table name
                    connection.native_tables.push(table.table_name);

                    // save default query
                    connection.queries.push({
                        query: ` SELECT * FROM ${table.table_name}`,
                        type: 'default_query',
                        alias: table.table_name,
                        table: table.table_name
                    });
                });
            } else {
                tables[0].forEach(table => {

                    // save native table name
                    connection.native_tables.push(table.table_name);

                    // save default query
                    connection.queries.push({
                        query: ` SELECT * FROM ${table.TABLE_NAME}`,
                        type: 'default_query',
                        alias: table.TABLE_NAME,
                        table: table.TABLE_NAME
                    });
                });
            }

            // Get all connections from the app storage
            const connections = db.get('connections').value();

            // Add new one to them
            connections.push(connection);

            // & update connections after
            db.get('connections').assign({ connections }).write();
        });

        return connection;

    } catch (e) {

        console.error(e);
    }
}


async function deleteConnection(name) {
    try {

        // Get all connections from the app storage
        const connections = await db
            .get('connections')
            .value();

        // Remove one of them by name
        connections.splice(
            connections.findIndex(connection => connection.name === name), 1);

        // & update connections after
        db.get('connections')
            .assign({ connections })
            .write();

        return connections;

    } catch (e) {

        console.error(e);
    }
}

// Export db's methods
module.exports = {
    addConnection,
    deleteConnection
};
