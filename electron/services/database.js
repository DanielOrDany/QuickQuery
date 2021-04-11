const low = require('lowdb');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const appDataDirPath = getAppDataPath();
const adapter = new FileSync(path.join(appDataDirPath, 'database.json'));

const database = low(adapter);

function getAppDataPath() {
    switch (process.platform) {
        case "darwin": {
            return path.join(process.env.HOME, "Library", "Application\ Support", "QuickQuery");
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
const crypto = require('crypto-js');
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
        "licenseKey": "ZChKQCQxeiMkIWRnZGYkJTJmZA=="
    }).write();
}

async function getDataFromDatabase() {
    const databaseData = await database.read().value();

    if (databaseData) {
        return databaseData;
    } else {
        await createDefaultDatabase();
        return await database.read().value();
    }

}

async function getDatabaseForTransport() {
    const databaseInJSON = await database.read().value();
    let databaseInString = JSON.stringify(databaseInJSON);
    let bytes = await utf8.encode(databaseInString);
    let encodedDatabase = base64.encode(bytes);
    return encodedDatabase;
}

async function loadDatabase(encodedDatabase) {
    try {
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
    } catch (e) {
        console.log(e);
    }
}

async function checkLicense() {
    console.log("checking...");
    const key = await database.get('licenseKey').value();
    console.log(key);
    let bytes = await base64.decode(key);
    let string = await utf8.decode(bytes);

    if(string === "d(J@$1z#$!dgdf$%2fd") {
        return "no-license";
    }

    let aes = string.split("|");
    let keyDecr = crypto.AES.encrypt(aes[1], aes[0]).toString(crypto.enc.Utf8);
    let keySplit = keyDecr.split('~');

    if(Date.now() <= parseInt(dates[2]) + parseInt(dates[3])) {
        return "good-license";
    } else {
        return "update-license";
    }
}

async function setTrial() {
    try {
        const key = await database.get('licenseKey').value();
        let bytes = await base64.decode(key);
        let string = await utf8.decode(bytes);

        if(string === "d(J@$1z#$!dgdf$%2fd") {
            let trialTime = "604800000~";
            let currentDate = Date.now().toString();
            let trialKey = trialTime + currentDate;
            await updateKey(trialKey);
            return "trial-license";
        } else {
            return "error-license";
        }
    } catch(e) {
        console.error(e);
    }
}

async function updateKey(licenseKey) {
    try {
        let bytes = base64.decode(licenseKey);
        let aes = utf8.decode(bytes);
        let split = aes.split("|");
        let aesKey = split[0];
        let aesEncr = split[1];
        let key = crypto.AES.decrypt(aesEncr, aesKey).toString(crypto.enc.Utf8);
        split = key.split("~");
        let date = Date.now();

        if(date <= parseInt(split[3]) + 604800000) {
            let key = `${split[0]}~${split[1]}~${split[2]}~${date}`;
            let encrKey = Math.random().toString(36).substring(2, 7);
            let keyEncr = crypto.AES.encrypt(key, encrKey).toString();
            let newBytes = utf8.encode(`${encrKey}|${keyEncr}`);
            let new_encoded = base64.encode(newBytes);
            database.set('licenseKey', new_encoded).write();

            let storedKey = await database.get("licenseKey").value();

            if(storedKey === new_encoded) {
                return "key-updated";
            }

            return "key-error";
        }

        return "key-outdated";
    } catch(e) {
        console.error(e);
    }
}

// Export database's methods
module.exports = {
    createDefaultDatabase,
    getDataFromDatabase,
    getDatabaseForTransport,
    loadDatabase,
    checkLicense,
    setTrial,
    updateKey
};
