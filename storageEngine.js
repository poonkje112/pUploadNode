const bus = require('connect-busboy');
const dbInfo = require('./dbInfo.json');
const fs = require('fs');

module.exports = {
    uploadFile: function (filestream, filename, perm, password, callback) {
        if (perm === true && password === "321") {
            // Upload perm file
            var path = dbInfo['fileStorage'] + filename;
            file.pipe(fs.createWriteStream(path));
            callback.call();
        } else {
            // Throw arrow back to callback
            console.log(`FAILED: perm = ${perm} and password = '${password}'`);
        }

    }
}