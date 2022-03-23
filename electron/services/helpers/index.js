const path = require('path');

function sortByLength (array) {
    return array.sort((x,y) => x.length - y.length);
}

function isEmpty(str) {
    return !str.trim().length;
}

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

module.exports = {
    sortByLength,
    isEmpty,
    getAppDataPath
};