(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();

var User = require('./models/user');

var express = require('express');
var session = require('express-session');
var vhost = require('vhost');
var app = express();
var router = express.Router();
var qt = require('quickthumb');

var favicon = require('serve-favicon');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/labeli-api');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'labeliSessionPwordAss',
    resave: true,
    saveUninitialized: true
}));

app.use(function (req, res, next) {
    res.header("Cache-Control", "no-cache");
    res.header("Access-Control-Allow-Origin", "http://localhost:9020");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

app.use(function (req, res, next) {
    console.log("request by " + req.session.userId);

    if (req.session.userId == undefined) {
        req.session.userId = null;
        req.session.level = -1;
    }

    next();
});

app.use(require('./routes/users'));
app.use(require('./routes/projects'));
app.use(require('./routes/auth'));
app.use(require('./routes/messages'));
app.use(require('./routes/votes'));
app.use(require('./routes/projectUsers'));
app.use(require('./routes/surveys'));
app.use(require('./routes/surveyItems'));
app.use(require('./routes/surveyVotes'));
app.use(require('./routes/upload'));

// Use quickthumb
app.use(qt.static(__dirname + '/', { type : 'resize' }));
// Show the upload form
app.get('/uploadAFile', function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    var form = '<form action="/upload" enctype="multipart/form-data" method="post">Add a title: <input name="name" type="text" /><br><br><input multiple="multiple" name="upload" type="file" /><br><br><input type="submit" value="Upload" /></form>';
    res.end(form);
});
app.listen(8080);

// Add doc
app.use("/", express.static("./doc/"));

// Add favicon
app.use(favicon(__dirname + "/styles/favicon.ico"));

app.use(router);
app.listen(9010);
