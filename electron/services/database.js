const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDatatDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDatatDirPath, 'database.json'));
const database = low(adapter);

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


const fs = require('fs');
const base64 = require('base-64');
const utf8 = require('utf8');
const pg = require('pg');
pg.defaults.ssl = true;

// Set some defaults (required if your JSON file is empty)
async function createDefaultDatabase() {
    await database.defaults({
        "Connections":[],
        "Settings":
            {
                "language":"en",
                "theme":"white"
            }
    }).write();
}

async function getDataFromDatabase() {
    return {
        connections: await database.get('Connections').value(),
        settings: await database.get('Settings').value()
    }
}

async function getDatabaseForTransport() {
    const databaseInJSON = {
        connections: await database.get('Connections').value(),
        settings: await database.get('Settings').value()
    };
    let databaseInString = JSON.stringify(databaseInJSON);
    let bytes = await utf8.encode(databaseInString);
    let encodedDatabase = base64.encode(bytes);
    return encodedDatabase;
}

async function loadDatabase(encodedDatabase) {
    let bytes = await base64.decode(encodedDatabase);
    let databaseInString = await utf8.decode(bytes);
    fs.writeFile('database.json', '', () => {
        fs.writeFile('database.json', databaseInString, function() { console.log('done') })
    });
}


// Export database's methods
module.exports = {
    createDefaultDatabase,
    getDataFromDatabase,
    getDatabaseForTransport,
    loadDatabase
};
