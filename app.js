const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const sql = require('mysql');
const dbInfo = require('./dbInfo.json');
const uid = require('uniqid');
const fs = require('fs');
const request = require('request');
const Unsplash = require('unsplash-js').default;
const FileType = require('file-type');
const readChunk = require('read-chunk');
const imageSize = require('image-size');
const $ = require('jquery');

const time = [];
const ids = [];
const backgroundInfo = {
    username: "John Westrock",
    rawURI: "https://images.unsplash.com/photo-1562158498-3f572baaf697?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjg2NjQzfQ",
    userprofile: "https://unsplash.com/@johnwestrock"
}
const unsplash = new Unsplash({
    applicationId: dbInfo["splashId"],
    secret: dbInfo["splashSecret"]
});

function toJson(res) {
    return typeof res.json === "function" ? res.json() : res;
}



const con = sql.createConnection({
    host: dbInfo['host'],
    user: dbInfo['username'],
    password: dbInfo['password'],
    database: dbInfo['database']
});

con.connect(function (err) {
    if (err) console.log(err);
    console.log("Connected to database!")
});

// Creating our storage engine
const storage = multer.diskStorage({
    destination: dbInfo['fileStorage'],
    filename: function (req, file, cb) {
        const curDate = Date.now();
        const eDate = (curDate + 86400000);
        const fileID = uid();
        cb(null, fileID + path.extname(file.originalname));
        con.query("INSERT INTO `upload_DB` (`ID`, `fileID`, `sDate`, `eDate`, `fileName`) VALUES (NULL, '" + fileID + "', '" + curDate + "', '" + eDate + "', '" + escape(file.originalname) + "')")
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
        embedLink: "http://www.poonkje.com/samplefile",
        filenamedir: "/static/uploads/",
        username: backgroundInfo.username,
        profileURI: backgroundInfo.userprofile,
        uri: backgroundInfo.rawURI
    });
});


// If there is an id we open the file download page
app.get('/:id', function (req, res) {
    request(`http://check.getipintel.net/check.php?ip=${req.connection.remoteAddress}&contact=${dbInfo["contactEmail"]}&flags=b`,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (parseFloat(body) > 0.99) {
                    res.send("ERROR: VPN's and Proxy's are not allowed!");
                } else {
                    con.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + req.params.id + "'", function (err, result, fields) {
                        if (err) {
                            res.send("id: " + req.params.id)
                        } else if (result[0] !== undefined) {
                            var imgDimension = undefined;
                            const MIME = FileType(readChunk.sync(dbInfo['fileStorage'] + "/" + req.params.id + path.extname(result[0]['fileName']), 0, FileType.minimumBytes)).mime;
                            if (MIME.includes("image")) {
                                imgDimension = imageSize(dbInfo['fileStorage'] + "/" + req.params.id + path.extname(result[0]['fileName']));
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
                            // console.log(dbInfo['fileStorage'] + req.params.id + path.extname(result[0]['fileName']));
                        } else {
                            res.send('Error 404')
                        }
                    })
                }
            }
        });
});


// If there is an id we open the file download page
app.get('/e/:id', function (req, res) {
    request(`http://check.getipintel.net/check.php?ip=${req.connection.remoteAddress}&contact=${dbInfo["contactEmail"]}&flags=b`,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (parseFloat(body) > 0.99) {
                    res.send("ERROR: VPN's and Proxy's are not allowed!");
                } else {
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
                }
            }
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
    request(`http://check.getipintel.net/check.php?ip=${req.connection.remoteAddress}&contact=${dbInfo["contactEmail"]}&flags=b`,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (parseFloat(body) > 0.99) {
                    res.send("ERROR: VPN's and Proxy's are not allowed!");
                } else {
                    res.render('index', {
                        username: backgroundInfo.username,
                        profileURI: backgroundInfo.userprofile,
                        uri: backgroundInfo.rawURI
                    });
                }
            }
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

setInterval(function () {
    con.query("SELECT * FROM `upload_DB` WHERE eDate < " + Date.now(), function (err, results, fields) {
        if (results[0] !== undefined) {
            for (i = 0; i < results.length; i++) {
                const fileName = results[i]['fileID'] + path.extname(results[i]['fileName']);
                fs.unlink(dbInfo['fileStorage'] + fileName, function (err) {
                    if (err) { }
                });
                con.query("DELETE FROM `upload_DB` WHERE `upload_DB`.`fileID` = '" + results[i]['fileID'] + "'");
            }
        }
    });

    for (i = 0; i < ids.length; i++) {
        const id = ids.pop();
        const t = time.pop();
        con.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + id + "'", function (err, results, fields) {
            con.query("UPDATE `upload_DB` SET `eDate` = '" + (parseInt(results[0]["sDate"], 10) + (86400000 * t)) + "' WHERE `upload_DB`.`fileID` = '" + id + "'");
        });
    }

}, interval);

const bminutes = 2;
const binterval = bminutes * 60 * 1000;

setInterval(function () {
    unsplash.photos.getRandomPhoto({
        width: 4096,
        height: 2160,
        query: "natural"
    }).then(toJson).then(json => {
        backgroundInfo.userprofile = json['user']['links']['html'] + "?utm_source=pUploads&utm_medium=referral";
        backgroundInfo.username = json['user']['name'];
        backgroundInfo.rawURI = json['urls']['raw'];
    });
}, binterval);