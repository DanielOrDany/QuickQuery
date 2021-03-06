const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
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

        const selectAllTables = `
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_type='BASE TABLE'
        AND table_schema='${schema}';`;

        const connection = {
            name: name,
            URI: uri ? uri : {
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
            queries: []
        };

        await sequelize.query(selectAllTables).then(tables => {

            // Generate default tables
            if (dtype === 'postgres') {
                tables[0].forEach(table => {
                    connection.queries.push({
                        query: ` SELECT * FROM ${table.table_name}`,
                        type: 'default_query',
                        alias: table.table_name,
                        table: table.table_name
                    });
                });
            } else {
                tables[0].forEach(table => {
                    connection.queries.push({
                        query: ` SELECT * FROM ${table.TABLE_NAME}`,
                        type: 'default_query',
                        alias: table.TABLE_NAME,
                        table: table.TABLE_NAME
                    });
                });
            }

            // Get connections
            const connections = db
                .get('connections')
                .value();

            // Add new one
            connections.push(connection);

            // Update connections
            db.get('connections')
                .assign({ connections })
                .write();
        });

        console.log('connection added!');
        return connection;
    } catch (e) {
        console.log(e);
    }
}

async function deleteConnection(name) {
    // Get connections
    const connections = await db
        .get('connections')
        .value();

    // Add new one
    connections.splice(
        connections.findIndex(connection => connection.name === name), 1);

    // Update connections
    db.get('connections')
        .assign({ connections })
        .write();

    return connections;
}

// Export db's methods
module.exports = {
    addConnection,
    deleteConnection
};
