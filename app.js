const express = require('express');
const bus = require('connect-busboy');
const ejs = require('ejs');
// const Recaptcha = require('express-recaptcha').RecaptchaV3;
const fs = require('fs');

const path = require('path');

const FileType = require('file-type');
const readChunk = require('read-chunk');
const imageSize = require('image-size');

const background = require('./background-api');
const ipIntel = require('./ipintel-api');
const database = require('./databaseController');

const dbInfo = require('./dbInfo.json');


var backgroundInfo = background.getRandomBackground("natural", 4096, 2160);
// var backgroundInfo = {
//     userprofile: "https://unsplash.com/@8moments?utm_source=pUploads&utm_medium=referral",
//     username: "Simon Matzinger",
//     rawURI: "https://images.unsplash.com/photo-1500622944204-b135684e99fd?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjg2NjQzfQ"
// }


const con = database.createConnection();

// Creating our web app
const app = express();

// Setting our view engine to EJS
app.set('view engine', 'ejs');

// Just a sample page for design purposes
app.get('/samplefile', function (req, res) {
    res.render('file', {
        filename: "Sample File",
        date: new Date(),
        fid: req.params.id,
        embedLink: "http://www.uploads.poonkje.com/samplefile",
        filenamedir: "/static/uploads/",
        username: backgroundInfo.username,
        profileURI: backgroundInfo.userprofile,
        uri: backgroundInfo.rawURI,
        MD5: "undefined"
    });
});

app.get('/nojs', function (req, res) {
    res.render('no-js', {
        username: backgroundInfo.username,
        profileURI: backgroundInfo.userprofile,
        uri: backgroundInfo.rawURI
    });
});

app.get('/adb', function (req, res) {
    res.render('adb', {
        username: backgroundInfo.username,
        profileURI: backgroundInfo.userprofile,
        uri: backgroundInfo.rawURI
    });
});


// If there is an id we open the file download page
app.get('/:id', function (req, res) {
    ipIntel.IpBanned(req.connection.remoteAddress, res, function () {
        con.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + req.params.id + "'", function (err, result, fields) {
            if (err) {
                res.send("id: " + req.params.id)
            } else if (result[0] !== undefined) {
                var imgDimension = undefined;
                const MIME = FileType(readChunk.sync(dbInfo['fileStorage'] + req.params.id + path.extname(result[0]['fileName']), 0, FileType.minimumBytes)).mime;
                if (MIME.includes("image")) {
                    imgDimension = imageSize(dbInfo['fileStorage'] + req.params.id + path.extname(result[0]['fileName']));
                } else {
                    imgDimension = {
                        width: 1,
                        height: 1
                    }
                }
                res.render('file', {
                    username: backgroundInfo.username,
                    profileURI: backgroundInfo.userprofile,
                    uri: backgroundInfo.rawURI,
                    filename: unescape(result[0]['fileName']),
                    date: new Date(parseInt(result[0]['sDate'])),
                    fid: req.params.id,
                    embedLink: "http://www.uploads.poonkje.com/e/" + req.params.id,
                    filenamedir: "http://www.uploads.poonkje.com/embedImage/" + req.params.id + path.extname(result[0]['fileName']),
                    og_size_x: imgDimension.width,
                    og_size_y: imgDimension.height,
                    MD5: result[0]['MD5']
                });
            } else {
                res.render('error-404', {
                    username: backgroundInfo.username,
                    profileURI: backgroundInfo.userprofile,
                    uri: backgroundInfo.rawURI
                });
            }
        })
    });
});


// If there is an id we open the file download page
app.get('/e/:id', function (req, res) {
    ipIntel.IpBanned(req.connection.remoteAddress, res, function () {
        con.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + req.params.id + "'", function (err, result, fields) {
            if (err) {
                res.send("id: " + req.params.id)
            } else if (result[0] !== undefined) {
                res.download(dbInfo['fileStorage'] + result[0]['fileID'] + unescape(path.extname(result[0]['fileName'])), unescape(result[0]['fileName']), function (err) {
                    if (err) {
                        throw (err);
                    }
                });
            }
        })
    });
});

app.post('/:id', function (req, res) {
    con.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + req.params.id + "'", function (err, result, fields) {
        if (err) {
            res.send("id: " + req.params.id)
        } else if (result[0] !== undefined) {
            res.download(dbInfo['fileStorage'] + result[0]['fileID'] + unescape(path.extname(result[0]['fileName'])), unescape(result[0]['fileName']), function (err) {
                if (err) {
                    throw (err);
                }
            });
        }
    })
});

//If there is no ID then we go to load our upload form
app.get('/', function (req, res) {
    ipIntel.IpBanned(req.connection.remoteAddress, res, function () {
        res.render('index', {
            username: backgroundInfo.username,
            profileURI: backgroundInfo.userprofile,
            uri: backgroundInfo.rawURI
        });
    });
});

// What to do when there is a post for /
app.post('/', bus({ immediate: true }), (req, res) => {
    var password, perm, failed, lifetime, FID;
    req.busboy.on('field', function (fieldname, value) {
        console.log(`${fieldname} : ${value}`);
        if (fieldname === "password") password = value;
        if (fieldname === "lifeTime" && value === "perm") {
            perm = true;
        } else if (fieldname === "lifeTime") {
            if (isNaN(value)) {
                lifetime = 1;
            } else if (parseInt(value) > 3) {
                lifetime = 3;
            } else if (parseInt(value) < 1) {
                lifetime = 1;
            } else {
                lifetime = parseInt(value);
            }
        }
    });

    req.busboy.on('file', function (fieldname, file, filename) {
        if (filename !== "") {
            if (perm === true) {
                if (password === "321") { // TODO Change this
                    var curDate = Date.now();
                    var eDate = perm ? -1 : curDate + (86400000 * parseInt(lifetime));
                    FID = database.uploadFile(con, filename, curDate, eDate, file);
                } else {
                    failed = true;
                    res.render('index', {
                        msg: "Wrong password!",
                        username: backgroundInfo.username,
                        profileURI: backgroundInfo.userprofile,
                        uri: backgroundInfo.rawURI
                    });
                }
            } else {
                var curDate = Date.now();
                var eDate = perm ? -1 : curDate + (86400000 * parseInt(lifetime));
                FID = database.uploadFile(con, filename, curDate, eDate, file);
            }
        } else {
            res.render('index', {
                msg: "No file selected!",
                username: backgroundInfo.username,
                profileURI: backgroundInfo.userprofile,
                uri: backgroundInfo.rawURI
            });
        }
    });

    req.busboy.on('finish', function () {
        if (!failed) {
            res.render('index', {
                msg: "",
                username: backgroundInfo.username,
                profileURI: backgroundInfo.userprofile,
                uri: backgroundInfo.rawURI,
                dl: "http://uploads.poonkje.com/" + FID
            });
        }
    });
});

//Setting our static folders
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use(express.static(dbInfo['fileStorage']));
app.use('/embedImage', express.static(dbInfo['fileStorage']));

//Setting our webserver port
const port = 80;

app.listen(port, () => console.log(`Server started on port ${port}`));

const minutes = 0.3;
const interval = minutes * 60 * 1000;

setInterval(function () {
    database.purgeFiles(con);
}, interval);

const bminutes = 2;
const binterval = bminutes * 60 * 1000;

setInterval(function () {
    // backgroundInfo = background.getRandomBackground("natural", 4096, 2160);
}, binterval);