const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const sql = require('mysql');
const dbInfo = require('./dbInfo.json')
const uid = require('uniqid');
const fs = require('fs');

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
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        const curDate = Date.now();
        const eDate = (curDate + (3 * 86400000));
        const fileID = uid();
        cb(null, fileID + path.extname(file.originalname));
        con.query("INSERT INTO `upload_DB` (`ID`, `fileID`, `sDate`, `eDate`, `fileName`) VALUES (NULL, '" + fileID + "', '" + curDate + "', '" + eDate + "', '" + file.originalname + "')")
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
app.get('/:id', function (req, res) {
    con.query("SELECT * FROM `upload_DB` WHERE BINARY `fileID` = '" + req.params.id + "'", function (err, result, fields) {
        if (err) {
            res.send("id: " + req.params.id)
        } else if (result[0] !== undefined) {
            res.download("./public/uploads/" + result[0]['fileID'] + path.extname(result[0]['fileName']), result[0]['fileName'], function (err) {
                if (err) {
                    throw (err);
                } else {
                }
            });
        } else {
            res.send('Error 404')
        }
    })
});

//If there is no ID then we go to load our upload form
app.get('/', (req, res) => res.render('index'));

// What to do when there is a post for /upload
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('index', {
                msg: err
            });
        } else if (req.file == undefined) {
            res.render('index', {
                msg: 'Error: No file selected'
            })
        } else {
            var name = req.file.filename;
            name = name.replace(path.extname(name), "");
            res.render('index', {
                dl: "http://www.uploads.poonkje.com/" + name
            });
        }
    });
});

//Setting our static folder
app.use(express.static('./public'));

//Setting our webserver port
const port = 80;

//Starting our server!
app.listen(port, () => console.log(`Server started on port ${port}`));

const minutes = 0.3;
const interval = minutes * 60 * 1000;

setInterval(function () {
    con.query("SELECT * FROM `upload_DB` WHERE eDate < " + Date.now(), function (err, results, fields) {
        if (results[0] !== undefined) {
            for (i = 0; i < results.length; i++) {
                const fileName = results[i]['fileID'] + path.extname(results[i]['fileName']);
                fs.unlink('./public/uploads/' + fileName, function (err) {
                    if (err) { }
                });
                con.query("DELETE FROM `upload_DB` WHERE `upload_DB`.`fileID` = '" + results[i]['fileID'] + "'");
            }
        }
    });
}, interval);