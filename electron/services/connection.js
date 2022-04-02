const low = require('lowdb');
const path = require('path');
const fs = require('fs');
const tunnel = require('tunnel-ssh');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const SequelizeTunnelService = require('./sequalize');
const FireSQL = require("firesql").FireSQL;
const firebase = require("firebase/app");
const admin = require("firebase-admin");
const getFirestore = require("firebase/firestore/lite").getFirestore;

// Required for side-effects
require("firebase/firestore");

if (fs.existsSync(adapter.source)) {
    console.log("The file exists.");
} else {
    console.log('The file does not exist.');
    if(!fs.existsSync(appDataDirPath)) {
        fs.mkdirSync(appDataDirPath);
    }
    fs.writeFileSync(adapter.source, JSON.stringify({
        "connections": [],
        "settings": {
            "language": "en",
            "theme": "white"
        }
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

async function renameConnection(connectionName, newConnectionName) {
    // throw error if connection already exist
    await verifyConnection(newConnectionName);

    // Update connection name
    db.read()
        .get('connections')
        .find({name: connectionName})
        .assign({name: newConnectionName})
        .write();

    // Get connections
    const connections = await db
        .get('connections')
        .value();

    return connections;
}

async function addConnection(params) {
    let {
        name,
        host,
        port,
        user,
        password,
        database,
        schema,
        dtype,
        uri,
        sshHost,
        sshPort,
        sshUser,
        sshPassword,
        sshPrivateKey,
        firebaseConfig
    } = params;

    console.log("params", params);

    if (dtype === 'mysql' || dtype === 'postgres') {
        if (uri) {
            dtype = uri.split('://')[0];
        }

        // throw error if connection already exist
        await verifyConnection(name);

        try {
            let sequelize;

            if (uri) {
                sequelize = new Sequelize(uri);
            } else if (sshHost) {

                // basic connection to a database
                const dbConfig = {
                    database: database,
                    username: user,
                    password: password,
                    dialect: dtype,
                    port: port
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
                sequelize = new Sequelize(database,
                    user,
                    password,
                    {
                        host: host,
                        dialect: dtype
                        // ssl: true,
                        // dialectOptions: {
                        //     ssl: {
                        //         require: true,
                        //         rejectUnauthorized: false // <<<<<< YOU NEED THIS
                        //     }
                        // }
                    }
                );
            }

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
                    port: port,
                    others: {
                        host: host,
                        dialect: dtype
                    }
                },
                schema: schema,
                queries: [], // saved constructor queries
                native_tables: [], // native db names of tables
                createdAt: getCurrentDate(), // date connection was added
                sshHost,
                sshPort,
                sshUser,
                sshPassword,
                sshPrivateKey,
                dtype
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
                        connection.native_tables.push(table.TABLE_NAME);

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

    } else if (dtype === 'firestore') {
        try {
            const serviceAccount = require(firebaseConfig);

            const connection = {
                name: name, // connection alias
                schema: '*',
                firebaseConfig: serviceAccount,
                queries: [], // saved constructor queries
                native_tables: [], // native db names of tables
                createdAt: getCurrentDate(), // date connection was added
                dtype
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });

            const firebase_db = admin.firestore();

            const tablesRef = await firebase_db.listCollections();

            const tables = tablesRef.map((tableRef) => {
                return tableRef.id;
            });

            tables.forEach((tableName) => {
                connection.native_tables.push(tableName);

                // save default query
                connection.queries.push({
                    query: ` SELECT * FROM ${tableName}`,
                    type: 'default_query',
                    alias: tableName,
                    table: tableName
                });
            });

            // Get all connections from the app storage
            const connections = db.get('connections').value();

            // Add new one to them
            connections.push(connection);

            // & update connections after
            db.get('connections').assign({ connections }).write();

            return connection;
            // const fireSQL = new FireSQL(app.firestore());

            // const citiesPromise = fireSQL.query(`SELECT * FROM public`);
            //
            // citiesPromise.then(cities => {
            //     console.log(cities);
            // });

            // const firebaseApp = firebase.initializeApp(firebaseConfig);
            //
            // const db = firebaseApp.firestore;
            // console.log("dbRef", db);
            //
            // const fireSQL = new FireSQL(db);
            // console.log("fireSQL", fireSQL);
            //
            // const citiesPromise = await fireSQL.query(`SELECT * FROM public`);
            // console.log("citiesPromise", citiesPromise);
        } catch (e) {
            console.log('e e e', e);
        }
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

function getCurrentDate() {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${day}/${month < 10 ? `0${month}` : month}/${year}`;
    return currentDate;
}

// Export db's methods
module.exports = {
    addConnection,
    deleteConnection,
    renameConnection
};
