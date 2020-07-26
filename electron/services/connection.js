const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDatatDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDatatDirPath, 'database.json'));
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

async function verifyConnection (name) {
    const connectionInDatabase = await db.get('Connections').find({name: name}).value();
    if (connectionInDatabase)
        throw "Connection with this name already exist!";
}

async function addConnection(name, host, port, user, password, database, schema, dtype) {
    console.log(name, host, port, user, password, database, schema, dtype);
    // throw error if connection already exist
    verifyConnection(name);

    try {
        const sequelize = new Sequelize(
            database,
            user,
            password,
            { host: host, dialect: dtype }
        );

        const selectAllTables = `
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_type='BASE TABLE'
        AND table_schema='${schema}';`;

        const connection = {
            name: name,
            URI: {
                database: database,
                user: user,
                password: password,
                schema: schema,
                others: {host: host, dialect:dtype}
            },
            queries: []
        };

        await sequelize.query(selectAllTables).then(tables => {
            console.log(tables);
            // Generate default tables
            if (dtype === 'postgres') {
                tables[0].forEach(table => {
                    connection.queries.push({
                        query: ` SELECT * FROM ${table.table_name}`,
                        type: 'default_query',
                        alias: table.table_name
                    });
                });
            } else {
                tables[0].forEach(table => {
                    connection.queries.push({
                        query: ` SELECT * FROM ${table.TABLE_NAME}`,
                        type: 'default_query',
                        alias: table.TABLE_NAME
                    });
                });
            }

            // Get connections
            const connections = db
                .get('Connections')
                .value();

            // Add new one
            connections.push(connection);

            // Update connections
            db.get('Connections')
                .assign({ connections })
                .write();
        });
        return connection;
    } catch (e) {
        console.log(e);
    }
}

async function deleteConnection(name) {

    // Get connections
    const connections = await db
        .get('Connections')
        .value();

    // Add new one
    connections.splice(
        connections.findIndex(connection => connection.name === name), 1);

    // Update connections
    db.get('Connections')
        .assign({ connections })
        .write();

    return connections;
}

// Export db's methods
module.exports = {

    addConnection,
    deleteConnection

};
