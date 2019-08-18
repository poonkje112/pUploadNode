const uid = require('uniqid');
const sql = require('mysql');
const dbInfo = require('./dbInfo.json');

var SQLConnection = undefined;

module.exports = {
    purgeFiles: function (connection) {
        var purgedFiles = 0;
        connection.query("SELECT * FROM `upload_DB` WHERE eDate < " + Date.now(), function (err, results, fields) {
            if (results[0] !== undefined) {
                for (i = 0; i < results.length; i++) {
                    const fileName = results[i]['fileID'] + path.extname(results[i]['fileName']);
                    fs.unlink(dbInfo['fileStorage'] + fileName, function (err) {
                        if (err) { } else { purgedFiles += 1; }
                    });
                    con.query("DELETE FROM `upload_DB` WHERE `upload_DB`.`fileID` = '" + results[i]['fileID'] + "'");
                }
            }
        });
        if (purgedFiles > 1) console.log(`${purgedFiles} Files deleted!`)
        else if (purgedFiles > 0) console.log(`${purgedFiles} File deleted!`)
    },
    addFile: function (connection) {
        const curDate = Date.now();
        const eDate = (curDate + 86400000);
        var fileID = uid();
        con.query("INSERT INTO `upload_DB` (`ID`, `fileID`, `sDate`, `eDate`, `fileName`) VALUES (NULL, '" + fileID + "', '" + curDate + "', '" + eDate + "', '" + escape(file.originalname) + "')");
        return fileID;
    },
    updateEndTime: function (connection, times, ID) {
        connection.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + ID + "'", function (err, results, fields) {
            connection.query("UPDATE `upload_DB` SET `eDate` = '" + (parseInt(results[0]["sDate"], 10) + (86400000 * times)) + "' WHERE `upload_DB`.`fileID` = '" + ID + "'");
        });
    },

    getFileInfo: function (connection, fileID) {

    },

    createConnection: function () {
        SQLConnection = sql.createConnection({
            host: dbInfo['host'],
            user: dbInfo['username'],
            password: dbInfo['password'],
            database: dbInfo['database']
        });

        return SQLConnection;
    }
}