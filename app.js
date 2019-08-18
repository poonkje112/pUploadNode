const express = require('express');
const multer = require('multer');
const ejs = require('ejs');

const path = require('path');

const FileType = require('file-type');
const readChunk = require('read-chunk');
const imageSize = require('image-size');

const background = require('./background-api');
const ipIntel = require('./ipintel-api');
const database = require('./databaseController');

const dbInfo = require('./dbInfo.json');

const $ = require('jquery');



var backgroundInfo = background.getRandomBackground("natural", 4096, 2160);

const con = database.createConnection();

// Creating our storage engine
const storage = multer.diskStorage({
    destination: dbInfo['fileStorage'],
    filename: function (req, file, cb) {
        const fileID = database.addFile(con, file.originalname);
        cb(null, fileID + path.extname(file.originalname));
    }
});

//Setting the options for multer
const upload = multer({
    storage: storage
}).single('myFile');

// Creating our web app
const app = express();

// Setting our view engine to EJS
app.set('view engine', 'ejs');

// If there is an id we open the file download page
app.get('/samplefile', function (req, res) {
    res.render('file', {
        filename: "Sample File",
        date: new Date(),
        fid: req.params.id,
        embedLink: "http://www.uploads.poonkje.com/samplefile",
        filenamedir: "/static/uploads/",
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
                    og_size_y: imgDimension.height
                });
            } else {
                res.send('Error 404')
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
                    } else {
                    }
                });
            } else {
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
                } else {
                }
            });
        } else {
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

// What to do when there is a post for /upload
app.post('/', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('index', {
                msg: err,
                username: backgroundInfo.username,
                profileURI: backgroundInfo.userprofile,
                uri: backgroundInfo.rawURI
            });
        } else if (req.file == undefined) {
            res.render('index', {
                msg: 'Error: No file selected',
                username: backgroundInfo.username,
                profileURI: backgroundInfo.userprofile,
                uri: backgroundInfo.rawURI
            })
        } else {
            var name = req.file.filename;
            name = name.replace(path.extname(name), "");

            if (parseInt(req.body.lifeTime) > 1) {
                if (req.body.lifeTime > 3) req.body.lifeTime = 3;
                ids.push(name);
                time.push(parseInt(req.body.lifeTime, 10));
            }

            res.render('index', {
                dl: "http://www.uploads.poonkje.com/" + name,
                username: backgroundInfo.username,
                profileURI: backgroundInfo.userprofile,
                uri: backgroundInfo.rawURI
            });
        }
    });
});

//Setting our static folders
app.use('/css', express.static(__dirname + '/public/css'));
app.use(express.static(dbInfo['fileStorage']));
app.use('/embedImage', express.static(dbInfo['fileStorage']));

//Setting our webserver port
const port = 80;

app.listen(port, () => console.log(`Server started on port ${port}`));

const minutes = 0.3;
const interval = minutes * 60 * 1000;

const time = [];
const ids = [];
setInterval(function () {

    database.purgeFiles(con);

    for (i = 0; i < ids.length; i++) {
        const id = ids.pop();
        const t = time.pop();
        database.updateEndTime(con, t, id);
    }

}, interval);

const bminutes = 2;
const binterval = bminutes * 60 * 1000;

setInterval(function () {
    backgroundInfo = background.getRandomBackground("natural", 4096, 2160);
}, binterval);