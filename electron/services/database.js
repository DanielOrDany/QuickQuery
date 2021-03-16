const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));
const database = low(adapter);

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

const fs = require('fs');
const base64 = require('base-64');
const utf8 = require('utf8');
const pg = require('pg');
pg.defaults.ssl = true;

// Set some defaults (required if your JSON file is empty)
async function createDefaultDatabase() {
    await database.defaults({
        "connections": [],
        "settings":
            {
                "language": "en",
                "theme": "white"
            },
        "licenseKey": "d(J@$1z#$!dgdf$%2fd"
    }).write();
}

async function getDataFromDatabase() {
    return await database.read().value();
}

async function getDatabaseForTransport() {
    const databaseInJSON = await database.read().value();
    let databaseInString = JSON.stringify(databaseInJSON);
    let bytes = await utf8.encode(databaseInString);
    let encodedDatabase = base64.encode(bytes);
    return encodedDatabase;
}

async function loadDatabase(encodedDatabase) {
    let bytes = await base64.decode(encodedDatabase);
    let databaseInString = await utf8.decode(bytes);

    if (databaseInString.includes("connections" && "settings" && "licenseKey")) {
        fs.writeFile('database.json', '', () => {
            fs.writeFile('database.json', databaseInString, function () {
                console.log('done')
            })
        });

        return true;
    } else {
        return false;
    }

}

async function checkLicense() {
    const databaseInJSON = await database.read().value();
    let key = databaseInJSON["licenseKey"];
    let bytes = await base64.decode(key);
    let string = await utf8.decode(bytes);

    let dates = string.split("~");

    if(dates.length > 1) {
        if(Date.now() <= parseInt(dates[0]) + parseInt(dates[1])) {
            return "good-license";
        } else {
            return "update-license";
        }
    } else {
        if(string === "d(J@$1z#$!dgdf$%2fd") {
            let trialTime = "\x36\x30\x34\x38\x30\x30\x30\x30\x30\x7e";
            let currentDate = await utf8.encode(Date.now());
            let trialBytes = trialTime + currentDate.toString();
            let trialKey = await base64.encode(trialBytes);
            await updateKey(trialKey);
            return "trial-license";
        } else {
            return "error-license";
        }
    }
    
}

async function updateKey(key) {
    await database.set("licenseKey", key).write();
}

// Export database's methods
module.exports = {
    createDefaultDatabase,
    getDataFromDatabase,
    getDatabaseForTransport,
    loadDatabase,
    checkLicense,
    updateKey
};
