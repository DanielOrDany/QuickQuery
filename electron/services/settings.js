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

function updateLanguage(language){

    // Update language
    db.set('settings.language', language)
        .write();
}





function updateTheme(theme){

    // Update theme
    db.set('settings.theme', theme)
        .write();
}




// Export db's methods
module.exports = {

    updateLanguage,
    updateTheme

}