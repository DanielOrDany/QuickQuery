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

function updateLanguage(language){

    // Update language
    db.set('Settings.language', language)
        .write();
}





function updateTheme(theme){

    // Update theme
    db.set('Settings.theme', theme)
        .write();
}




// Export db's methods
module.exports = {

    updateLanguage,
    updateTheme

}